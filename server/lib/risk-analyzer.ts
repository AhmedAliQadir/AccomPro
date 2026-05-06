import { prisma } from '../prisma';
import { chatWithTools } from './claude';
import { sendRiskAlertEmail } from './email';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

const RISK_ANALYSIS_PROMPT = `Analyse this organisation's current compliance data using the available tools. Check:

1. DBS checks — any expired or expiring within 30 days
2. Compliance audits — any overdue or with low scores
3. Incidents — any unresolved HIGH/CRITICAL incidents
4. Document compliance — any missing mandatory documents
5. Support delivery — attendance rates below 80%
6. Property occupancy — any properties with very low occupancy

Return ONLY a JSON array of risk items found. Each item must have:
- category: one of DBS_EXPIRY, OVERDUE_AUDIT, UNRESOLVED_INCIDENT, DOCUMENT_GAP, LOW_ATTENDANCE, OCCUPANCY_CONCERN
- severity: LOW, MEDIUM, HIGH, or CRITICAL
- title: short descriptive title
- description: detailed explanation
- recommendation: actionable next step
- entityType: optional (STAFF, COMPLIANCE, INCIDENT, DOCUMENT, TENANT, PROPERTY)
- entityId: optional

If no risks are found, return an empty array [].
Return ONLY valid JSON, no markdown fences or explanation.`;

interface RiskItem {
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation?: string;
  entityType?: string;
  entityId?: string;
}

export async function runRiskAnalysisForOrg(orgId: string): Promise<number> {
  const messages: MessageParam[] = [{ role: 'user', content: RISK_ANALYSIS_PROMPT }];

  const { content } = await chatWithTools(messages, orgId, { maxTokens: 4096 });

  let risks: RiskItem[];
  try {
    // Extract JSON from response (handle possible markdown fences)
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    risks = JSON.parse(jsonStr);
    if (!Array.isArray(risks)) risks = [];
  } catch {
    console.error(`Failed to parse risk analysis for org ${orgId}:`, content.substring(0, 200));
    return 0;
  }

  // Upsert alerts
  for (const risk of risks) {
    await prisma.riskAlert.create({
      data: {
        organizationId: orgId,
        category: risk.category,
        severity: risk.severity,
        title: risk.title,
        description: risk.description,
        recommendation: risk.recommendation,
        entityType: risk.entityType,
        entityId: risk.entityId,
      },
    });
  }

  // Email org admins if there are HIGH/CRITICAL alerts
  const criticalRisks = risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL');
  if (criticalRisks.length > 0) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          where: { role: { in: ['ADMIN', 'ORG_ADMIN', 'OPS'] } },
          select: { email: true },
        },
      },
    });

    if (org) {
      const subject = `[AccomPro] ${criticalRisks.length} High-Priority Risk Alert${criticalRisks.length > 1 ? 's' : ''} — ${org.name}`;
      const html = `
        <h2>Risk Alerts for ${org.name}</h2>
        <p>${criticalRisks.length} high-priority risk(s) detected:</p>
        <ul>
          ${criticalRisks.map(r => `
            <li>
              <strong>[${r.severity}] ${r.title}</strong><br/>
              ${r.description}<br/>
              <em>Recommendation: ${r.recommendation || 'Review immediately'}</em>
            </li>
          `).join('')}
        </ul>
        <p>Log in to AccomPro to review and acknowledge these alerts.</p>
      `;

      for (const user of org.users) {
        await sendRiskAlertEmail(user.email, subject, html);
      }
    }
  }

  return risks.length;
}

export async function runRiskAnalysis(): Promise<void> {
  const orgs = await prisma.organization.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  console.log(`Running risk analysis for ${orgs.length} organisation(s)...`);

  for (const org of orgs) {
    try {
      const count = await runRiskAnalysisForOrg(org.id);
      console.log(`  ${org.name}: ${count} risk(s) found`);
    } catch (error: any) {
      console.error(`  ${org.name}: Risk analysis failed — ${error.message}`);
    }
  }

  console.log('Risk analysis complete.');
}
