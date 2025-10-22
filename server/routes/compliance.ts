import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';
import { tenantContext, withTenantScope, type TenantRequest } from '../middleware/tenantContext';
import { z } from 'zod';

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(tenantContext);

// Validation schemas
const createComplianceSchema = z.object({
  auditType: z.enum([
    'CQC_INSPECTION',
    'INTERNAL_AUDIT',
    'FIRE_SAFETY',
    'HEALTH_SAFETY',
    'SAFEGUARDING',
    'MEDICATION',
    'GDPR_COMPLIANCE',
    'OTHER',
  ]),
  title: z.string().min(1),
  description: z.string().optional(),
  auditDate: z.string(),
  auditorName: z.string().optional(),
  auditorOrganization: z.string().optional(),
  findings: z.string().optional(),
  score: z.number().optional(),
  actionPlan: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateComplianceSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
  findings: z.string().optional(),
  actionPlan: z.string().optional(),
  score: z.number().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/compliance
 * Get all compliance audits for the current organization
 * Query params:
 *   ?status=PENDING|IN_PROGRESS|COMPLETED|OVERDUE
 *   ?type=CQC_INSPECTION|INTERNAL_AUDIT|...
 */
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { status, type } = req.query;

    const where: any = withTenantScope(req, {});

    if (status) where.status = status;
    if (type) where.auditType = type;

    const compliance = await prisma.compliance.findMany({
      where,
      orderBy: {
        auditDate: 'desc',
      },
    });

    res.json({ compliance });
  } catch (error) {
    console.error('Fetch compliance error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance audits' });
  }
});

/**
 * GET /api/compliance/dashboard
 * Get compliance dashboard statistics
 */
router.get('/dashboard', async (req: TenantRequest, res) => {
  try {
    const [
      totalAudits,
      pendingCount,
      inProgressCount,
      completedCount,
      overdueCount,
    ] = await Promise.all([
      prisma.compliance.count({ where: withTenantScope(req) }),
      prisma.compliance.count({ 
        where: withTenantScope(req, { status: 'PENDING' }) 
      }),
      prisma.compliance.count({ 
        where: withTenantScope(req, { status: 'IN_PROGRESS' }) 
      }),
      prisma.compliance.count({ 
        where: withTenantScope(req, { status: 'COMPLETED' }) 
      }),
      prisma.compliance.count({ 
        where: withTenantScope(req, { status: 'OVERDUE' }) 
      }),
    ]);

    // Get audits by type
    const auditsByType = await prisma.compliance.groupBy({
      by: ['auditType'],
      where: withTenantScope(req),
      _count: true,
    });

    // Get upcoming audits (due within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingAudits = await prisma.compliance.findMany({
      where: {
        ...withTenantScope(req),
        dueDate: {
          lte: thirtyDaysFromNow,
          gte: new Date(),
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    });

    // Get recent completed audits
    const recentCompleted = await prisma.compliance.findMany({
      where: {
        ...withTenantScope(req),
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
    });

    res.json({
      stats: {
        total: totalAudits,
        byStatus: {
          pending: pendingCount,
          inProgress: inProgressCount,
          completed: completedCount,
          overdue: overdueCount,
        },
        byType: auditsByType.map(item => ({
          type: item.auditType,
          count: item._count,
        })),
      },
      upcomingAudits,
      recentCompleted,
    });
  } catch (error) {
    console.error('Fetch compliance dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance dashboard' });
  }
});

/**
 * GET /api/compliance/:id
 * Get a single compliance audit by ID
 */
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const compliance = await prisma.compliance.findFirst({
      where: {
        id,
        ...withTenantScope(req),
      },
    });

    if (!compliance) {
      return res.status(404).json({ error: 'Compliance audit not found' });
    }

    res.json({ compliance });
  } catch (error) {
    console.error('Fetch compliance error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance audit' });
  }
});

/**
 * POST /api/compliance
 * Create a new compliance audit
 */
router.post('/', authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'), async (req: TenantRequest, res) => {
  try {
    const validation = createComplianceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    if (!req.organizationId) {
      return res.status(403).json({ error: 'Organization context required' });
    }

    const compliance = await prisma.compliance.create({
      data: {
        organizationId: req.organizationId,
        auditType: data.auditType,
        title: data.title,
        description: data.description,
        auditDate: new Date(data.auditDate),
        auditorName: data.auditorName,
        auditorOrganization: data.auditorOrganization,
        findings: data.findings ?? null,
        score: data.score,
        actionPlan: data.actionPlan ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
      },
    });

    res.status(201).json({ compliance });
  } catch (error) {
    console.error('Create compliance error:', error);
    res.status(500).json({ error: 'Failed to create compliance audit' });
  }
});

/**
 * PATCH /api/compliance/:id
 * Update a compliance audit
 */
router.patch('/:id', authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const validation = updateComplianceSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    // Verify compliance audit belongs to organization
    const existing = await prisma.compliance.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Compliance audit not found' });
    }

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.completedBy = req.user?.userId;
      }
    }

    if (data.findings !== undefined) updateData.findings = data.findings ?? null;
    if (data.actionPlan !== undefined) updateData.actionPlan = data.actionPlan ?? null;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.notes) updateData.notes = data.notes;

    const compliance = await prisma.compliance.update({
      where: { id },
      data: updateData,
    });

    res.json({ compliance });
  } catch (error) {
    console.error('Update compliance error:', error);
    res.status(500).json({ error: 'Failed to update compliance audit' });
  }
});

/**
 * POST /api/compliance/:id/evidence
 * Add evidence note to a compliance audit
 */
router.post('/:id/evidence', authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Evidence description required' });
    }

    // Verify compliance audit belongs to organization
    const compliance = await prisma.compliance.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!compliance) {
      return res.status(404).json({ error: 'Compliance audit not found' });
    }

    // Add evidence entry to JSON array
    const evidence = compliance.evidence || [];
    evidence.push({
      description,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.userId,
    });

    const updated = await prisma.compliance.update({
      where: { id },
      data: { evidence },
    });

    res.json({ compliance: updated });
  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({ error: 'Failed to add evidence' });
  }
});

export default router;
