import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth';
import { tenantContext, TenantRequest } from '../middleware/tenantContext';
import { prisma } from '../prisma';
import { streamChatWithTools, chatWithTools, complianceTools } from '../lib/claude';
import { generateInspectionReport } from '../lib/report-pdf-generator';
import { runRiskAnalysisForOrg } from '../lib/risk-analyzer';
import { extractText } from '../lib/document-extractor';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req: any) => req.user?.userId || req.ip,
  message: { error: 'AI rate limit exceeded. Please try again later.' },
});

// POST /api/ai/chat — SSE streaming chat with tool use
router.post('/chat', authenticate, tenantContext, aiLimiter, async (req: TenantRequest, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userId = req.user!.userId;
    const organizationId = req.organizationId!;

    // Load or create conversation
    let conversation: any;
    let messages: MessageParam[] = [];

    if (conversationId) {
      conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId, organizationId },
      });
      if (conversation) {
        messages = (conversation.messages as MessageParam[]) || [];
      }
    }

    messages.push({ role: 'user', content: message });

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let fullResponse = '';

    await streamChatWithTools(messages, organizationId, {
      onText: (text) => {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      },
      onToolStart: (toolName) => {
        res.write(`data: ${JSON.stringify({ type: 'tool_start', tool: toolName })}\n\n`);
      },
      onToolEnd: (toolName) => {
        res.write(`data: ${JSON.stringify({ type: 'tool_end', tool: toolName })}\n\n`);
      },
      onDone: async (tokenCount) => {
        // Save conversation
        messages.push({ role: 'assistant', content: fullResponse });

        const title = !conversation
          ? message.slice(0, 100)
          : undefined;

        if (conversation) {
          await prisma.aiConversation.update({
            where: { id: conversation.id },
            data: {
              messages: messages as any,
              tokenCount: { increment: tokenCount },
            },
          });
        } else {
          conversation = await prisma.aiConversation.create({
            data: {
              organizationId,
              userId,
              title,
              messages: messages as any,
              tokenCount,
            },
          });
        }

        res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conversation.id })}\n\n`);
        res.end();
      },
      onError: (error) => {
        console.error('Chat stream error:', error.message);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred processing your request.' })}\n\n`);
        res.end();
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process chat request' });
    }
  }
});

// GET /api/ai/conversations — List user's conversations
router.get('/conversations', authenticate, tenantContext, async (req: TenantRequest, res) => {
  try {
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: req.user!.userId, organizationId: req.organizationId! },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, tokenCount: true, createdAt: true, updatedAt: true },
      take: 50,
    });
    res.json({ conversations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/conversations/:id — Get a single conversation
router.get('/conversations/:id', authenticate, tenantContext, async (req: TenantRequest, res) => {
  try {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, organizationId: req.organizationId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ai/conversations/:id
router.delete('/conversations/:id', authenticate, tenantContext, async (req: TenantRequest, res) => {
  try {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: req.params.id, userId: req.user!.userId, organizationId: req.organizationId! },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    await prisma.aiConversation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/report/generate — Generate inspection readiness PDF
router.post(
  '/report/generate',
  authenticate,
  authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'),
  tenantContext,
  aiLimiter,
  async (req: TenantRequest, res) => {
    try {
      const organizationId = req.organizationId!;

      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) return res.status(404).json({ error: 'Organization not found' });

      const reportPrompt = `Generate a comprehensive CQC inspection readiness report for this organisation. Use all available tools to gather data, then write a detailed report with these sections:

1. **Executive Summary** — Overall compliance posture, key metrics, risk level
2. **Staff Compliance** — DBS status, training gaps, staffing levels
3. **Compliance Audits** — Recent audit results, overdue items, action plans
4. **Incident Management** — Incident patterns, unresolved items, trends
5. **Documentation** — Document verification rates, missing mandatory docs
6. **Support Delivery** — Session frequency, attendance rates, quality indicators
7. **Risk Assessment** — Current risks and their severity
8. **Recommendations** — Prioritised action items for inspection readiness

For each section, include specific data points, statistics, and actionable recommendations. Reference CQC fundamental standards where relevant.`;

      const messages: MessageParam[] = [{ role: 'user', content: reportPrompt }];
      const { content } = await chatWithTools(messages, organizationId, { maxTokens: 8192 });

      // Parse sections from AI response
      const sectionHeaders = [
        'Executive Summary',
        'Staff Compliance',
        'Compliance Audits',
        'Incident Management',
        'Documentation',
        'Support Delivery',
        'Risk Assessment',
        'Recommendations',
      ];

      const sections: { title: string; content: string }[] = [];
      const lines = content.split('\n');
      let currentSection: { title: string; lines: string[] } | null = null;

      for (const line of lines) {
        const headerMatch = sectionHeaders.find(h =>
          line.toLowerCase().includes(h.toLowerCase())
        );
        if (headerMatch && (line.startsWith('#') || line.startsWith('**'))) {
          if (currentSection) {
            sections.push({ title: currentSection.title, content: currentSection.lines.join('\n') });
          }
          currentSection = { title: headerMatch, lines: [] };
        } else if (currentSection) {
          currentSection.lines.push(line);
        } else {
          // Content before first section header — put in executive summary
          if (!sections.length) {
            currentSection = { title: 'Executive Summary', lines: [line] };
          }
        }
      }
      if (currentSection) {
        sections.push({ title: currentSection.title, content: currentSection.lines.join('\n') });
      }

      // Fallback if parsing failed
      if (sections.length === 0) {
        sections.push({ title: 'Inspection Readiness Report', content });
      }

      const userName = `${req.user!.email}`;
      const stream = generateInspectionReport({
        organizationName: org.name,
        generatedBy: userName,
        sections,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="inspection-readiness-report-${format(new Date())}.pdf"`
      );
      stream.pipe(res);
    } catch (error: any) {
      console.error('Report generation error:', error.message);
      res.status(500).json({ error: 'Failed to generate report' });
    }
  }
);

function format(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/ai/alerts — List risk alerts
router.get('/alerts', authenticate, tenantContext, async (req: TenantRequest, res) => {
  try {
    const where: any = { organizationId: req.organizationId! };
    if (req.query.acknowledged === 'true') where.isAcknowledged = true;
    if (req.query.acknowledged === 'false') where.isAcknowledged = false;
    if (req.query.severity) where.severity = req.query.severity;

    const alerts = await prisma.riskAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/ai/alerts/:id/acknowledge
router.patch(
  '/alerts/:id/acknowledge',
  authenticate,
  authorize('ADMIN', 'OPS', 'ORG_ADMIN'),
  tenantContext,
  async (req: TenantRequest, res) => {
    try {
      const alert = await prisma.riskAlert.findFirst({
        where: { id: req.params.id, organizationId: req.organizationId! },
      });
      if (!alert) return res.status(404).json({ error: 'Alert not found' });

      const updated = await prisma.riskAlert.update({
        where: { id: req.params.id },
        data: {
          isAcknowledged: true,
          acknowledgedBy: req.user!.userId,
          acknowledgedAt: new Date(),
        },
      });
      res.json({ alert: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/ai/alerts/run — Manual risk analysis trigger
router.post(
  '/alerts/run',
  authenticate,
  authorize('ADMIN', 'OPS', 'ORG_ADMIN'),
  tenantContext,
  aiLimiter,
  async (req: TenantRequest, res) => {
    try {
      const count = await runRiskAnalysisForOrg(req.organizationId!);
      res.json({ success: true, alertsCreated: count });
    } catch (error: any) {
      console.error('Manual risk analysis error:', error.message);
      res.status(500).json({ error: 'Failed to run risk analysis' });
    }
  }
);

// POST /api/ai/policy/review — Upload policy document for review
router.post(
  '/policy/review',
  authenticate,
  authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'),
  tenantContext,
  aiLimiter,
  upload.single('file'),
  async (req: TenantRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const text = await extractText(req.file.buffer, req.file.mimetype);

      if (!text.trim()) {
        return res.status(400).json({ error: 'Could not extract text from the uploaded document' });
      }

      const truncated = text.slice(0, 15000);

      const reviewPrompt = `You are reviewing a policy document for a UK supported housing organisation. Analyse the following policy text against CQC fundamental standards and UK housing regulations.

Provide a structured review with:
1. **Overall Assessment** — Is this policy compliant? Rate as: Compliant, Partially Compliant, or Non-Compliant
2. **Key Strengths** — What the policy does well
3. **Issues Found** — Specific gaps, outdated references, or missing requirements (list each with severity: LOW, MEDIUM, HIGH)
4. **CQC References** — Which CQC fundamental standards apply and whether they are met
5. **Recommendations** — Prioritised list of changes needed
6. **Missing Sections** — Required sections that are absent from the policy

Be specific and reference actual clauses/sections from the document.

Policy document text:
---
${truncated}
---`;

      const messages: MessageParam[] = [{ role: 'user', content: reviewPrompt }];
      const { content } = await chatWithTools(messages, req.organizationId!, { maxTokens: 4096 });

      res.json({
        review: content,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        extractedLength: text.length,
      });
    } catch (error: any) {
      console.error('Policy review error:', error.message);
      res.status(500).json({ error: 'Failed to review policy document' });
    }
  }
);

export default router;
