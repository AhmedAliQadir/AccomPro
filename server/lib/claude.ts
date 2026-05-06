import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Tool, ContentBlock, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import * as tools from './claude-tools';

const client = new Anthropic();

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are AccomPro AI, a compliance assistant for UK supported housing organisations. You help with CQC regulatory compliance, staff management, incident tracking, and operational insights.

Key guidelines:
- Always use the available tools to fetch real data before answering questions about the organisation
- Reference CQC fundamental standards and UK housing regulations when relevant
- Be concise and actionable in your responses
- When data indicates compliance gaps, clearly state the risk and recommend next steps
- Never fabricate data — always use tools to look up actual records
- Protect sensitive information — never expose NI numbers, mental health details, or criminal records
- Format responses with clear headings and bullet points for readability`;

export const complianceTools: Tool[] = [
  {
    name: 'get_staff_overview',
    description: 'Get an overview of all staff including counts, active/inactive status, and job titles',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_staff_dbs_status',
    description: 'Get DBS check status for all active staff — expired, expiring soon, valid, or missing',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_staff_training_status',
    description: 'Get training records for all active staff including expired training courses',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_compliance_audits',
    description: 'Get compliance audit records, optionally filtered by status or audit type',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'], description: 'Filter by audit status' },
        auditType: { type: 'string', enum: ['CQC_INSPECTION', 'INTERNAL_AUDIT', 'FIRE_SAFETY', 'HEALTH_SAFETY', 'SAFEGUARDING', 'MEDICATION', 'GDPR_COMPLIANCE', 'OTHER'], description: 'Filter by audit type' },
      },
      required: [],
    },
  },
  {
    name: 'get_compliance_dashboard',
    description: 'Get compliance dashboard stats: counts by status/type and upcoming audits',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_incident_stats',
    description: 'Get incident statistics broken down by status, severity, and type',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_incidents',
    description: 'Get incident records with details, optionally filtered by status or severity',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED'], description: 'Filter by status' },
        severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], description: 'Filter by severity' },
        limit: { type: 'number', description: 'Max records to return (default 20)' },
      },
      required: [],
    },
  },
  {
    name: 'get_tenant_overview',
    description: 'Get overview of all tenants: counts by status and document compliance issues',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_property_occupancy',
    description: 'Get occupancy rates for each property including room counts and vacancy info',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_document_compliance',
    description: 'Get document verification status across all tenants, including missing mandatory documents',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
  {
    name: 'get_support_notes_summary',
    description: 'Get support session summary: frequency, attendance rates, contact type breakdown',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'Number of days to look back (default 30)' },
      },
      required: [],
    },
  },
  {
    name: 'get_overdue_items',
    description: 'Get all overdue/critical items across the org: overdue audits, expired DBS checks, open critical incidents',
    input_schema: { type: 'object' as const, properties: {}, required: [] },
  },
];

const toolHandlers: Record<string, (orgId: string, input: any) => Promise<any>> = {
  get_staff_overview: (orgId) => tools.getStaffOverview(orgId),
  get_staff_dbs_status: (orgId) => tools.getStaffDbsStatus(orgId),
  get_staff_training_status: (orgId) => tools.getStaffTrainingStatus(orgId),
  get_compliance_audits: (orgId, input) => tools.getComplianceAudits(orgId, input),
  get_compliance_dashboard: (orgId) => tools.getComplianceDashboard(orgId),
  get_incident_stats: (orgId) => tools.getIncidentStats(orgId),
  get_incidents: (orgId, input) => tools.getIncidents(orgId, input),
  get_tenant_overview: (orgId) => tools.getTenantOverview(orgId),
  get_property_occupancy: (orgId) => tools.getPropertyOccupancy(orgId),
  get_document_compliance: (orgId) => tools.getDocumentCompliance(orgId),
  get_support_notes_summary: (orgId, input) => tools.getSupportNotesSummary(orgId, input),
  get_overdue_items: (orgId) => tools.getOverdueItems(orgId),
};

export async function executeToolCall(
  toolName: string,
  toolInput: any,
  organizationId: string
): Promise<string> {
  const handler = toolHandlers[toolName];
  if (!handler) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
  try {
    const result = await handler(organizationId, toolInput);
    return JSON.stringify(result);
  } catch (error: any) {
    return JSON.stringify({ error: error.message });
  }
}

export async function chatWithTools(
  messages: MessageParam[],
  organizationId: string,
  options?: { maxTokens?: number }
): Promise<{ content: string; tokenCount: number }> {
  const maxTokens = options?.maxTokens || 4096;
  let currentMessages = [...messages];
  let totalTokens = 0;

  // Agentic tool-use loop
  for (let i = 0; i < 10; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      tools: complianceTools,
      messages: currentMessages,
    });

    totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    if (response.stop_reason === 'end_turn' || response.stop_reason !== 'tool_use') {
      const textContent = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('');
      return { content: textContent, tokenCount: totalTokens };
    }

    // Process tool calls
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    currentMessages.push({ role: 'assistant', content: response.content as ContentBlock[] });

    const toolResults: ToolResultBlockParam[] = [];
    for (const toolUse of toolUseBlocks) {
      const result = await executeToolCall(toolUse.name, toolUse.input, organizationId);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    currentMessages.push({ role: 'user', content: toolResults });
  }

  return { content: 'I reached the maximum number of tool calls. Please try a more specific question.', tokenCount: totalTokens };
}

export interface StreamCallbacks {
  onText: (text: string) => void;
  onToolStart: (toolName: string) => void;
  onToolEnd: (toolName: string) => void;
  onDone: (tokenCount: number) => void;
  onError: (error: Error) => void;
}

export async function streamChatWithTools(
  messages: MessageParam[],
  organizationId: string,
  callbacks: StreamCallbacks
): Promise<void> {
  let currentMessages = [...messages];
  let totalTokens = 0;

  try {
    for (let i = 0; i < 10; i++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: complianceTools,
        messages: currentMessages,
      });

      const response = await stream.finalMessage();
      totalTokens += (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

      // Stream text blocks
      for (const block of response.content) {
        if (block.type === 'text') {
          callbacks.onText(block.text);
        }
      }

      if (response.stop_reason !== 'tool_use') {
        callbacks.onDone(totalTokens);
        return;
      }

      // Process tool calls
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      currentMessages.push({ role: 'assistant', content: response.content as ContentBlock[] });

      const toolResults: ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        callbacks.onToolStart(toolUse.name);
        const result = await executeToolCall(toolUse.name, toolUse.input, organizationId);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
        callbacks.onToolEnd(toolUse.name);
      }

      currentMessages.push({ role: 'user', content: toolResults });
    }

    callbacks.onText('\n\nI reached the maximum number of tool calls. Please try a more specific question.');
    callbacks.onDone(totalTokens);
  } catch (error: any) {
    callbacks.onError(error);
  }
}
