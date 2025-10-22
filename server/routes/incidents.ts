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
const createIncidentSchema = z.object({
  residentId: z.string().optional(),
  incidentType: z.enum([
    'SAFEGUARDING',
    'MEDICATION',
    'ACCIDENT',
    'NEAR_MISS',
    'BEHAVIORAL',
    'PROPERTY_DAMAGE',
    'MISSING_PERSON',
    'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  witnessDetails: z.string().optional(),
  actionsTaken: z.string().optional(),
  occurredAt: z.string().optional(),
});

const updateIncidentSchema = z.object({
  status: z.enum(['REPORTED', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED']).optional(),
  actionsTaken: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  followUpNotes: z.string().optional(),
  resolvedBy: z.string().optional(),
});

/**
 * GET /api/incidents
 * Get all incidents for the current organization
 * Query params: 
 *   ?status=REPORTED|UNDER_INVESTIGATION|RESOLVED|CLOSED
 *   ?severity=LOW|MEDIUM|HIGH|CRITICAL
 *   ?type=SAFEGUARDING|MEDICATION|...
 *   ?residentId=uuid
 */
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { status, severity, type, residentId } = req.query;

    const where: any = withTenantScope(req, {});

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (type) where.incidentType = type;
    if (residentId) where.residentId = residentId;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
    });

    res.json({ incidents });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * GET /api/incidents/stats
 * Get incident statistics for the organization
 */
router.get('/stats', async (req: TenantRequest, res) => {
  try {
    const [
      totalIncidents,
      reportedCount,
      underInvestigationCount,
      resolvedCount,
      criticalCount,
      highCount,
    ] = await Promise.all([
      prisma.incident.count({ where: withTenantScope(req) }),
      prisma.incident.count({ 
        where: withTenantScope(req, { status: 'REPORTED' }) 
      }),
      prisma.incident.count({ 
        where: withTenantScope(req, { status: 'UNDER_INVESTIGATION' }) 
      }),
      prisma.incident.count({ 
        where: withTenantScope(req, { status: 'RESOLVED' }) 
      }),
      prisma.incident.count({ 
        where: withTenantScope(req, { severity: 'CRITICAL' }) 
      }),
      prisma.incident.count({ 
        where: withTenantScope(req, { severity: 'HIGH' }) 
      }),
    ]);

    // Get incidents by type
    const incidentsByType = await prisma.incident.groupBy({
      by: ['incidentType'],
      where: withTenantScope(req),
      _count: true,
    });

    // Get recent critical incidents
    const recentCritical = await prisma.incident.findMany({
      where: withTenantScope(req, {
        severity: 'CRITICAL',
        status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] },
      }),
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: 5,
    });

    res.json({
      stats: {
        total: totalIncidents,
        byStatus: {
          reported: reportedCount,
          underInvestigation: underInvestigationCount,
          resolved: resolvedCount,
        },
        bySeverity: {
          critical: criticalCount,
          high: highCount,
        },
        byType: incidentsByType.map(item => ({
          type: item.incidentType,
          count: item._count,
        })),
      },
      recentCritical,
    });
  } catch (error) {
    console.error('Fetch incident stats error:', error);
    res.status(500).json({ error: 'Failed to fetch incident statistics' });
  }
});

/**
 * GET /api/incidents/:id
 * Get a single incident by ID
 */
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findFirst({
      where: {
        id,
        ...withTenantScope(req),
      },
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        reporter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json({ incident });
  } catch (error) {
    console.error('Fetch incident error:', error);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

/**
 * POST /api/incidents
 * Report a new incident
 */
router.post('/', async (req: TenantRequest, res) => {
  try {
    const validation = createIncidentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    if (!req.organizationId) {
      return res.status(403).json({ error: 'Organization context required' });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: 'User authentication required' });
    }

    // If residentId provided, verify it belongs to the organization
    if (data.residentId) {
      const resident = await prisma.tenant.findFirst({
        where: {
          id: data.residentId,
          organizationId: req.organizationId,
        },
      });

      if (!resident) {
        return res.status(404).json({ error: 'Resident not found in your organization' });
      }

      // For SUPPORT workers: Verify they are assigned to the resident's property
      if (req.user.role === 'SUPPORT') {
        // Get the resident's current tenancy to find their property
        const tenancy = await prisma.tenancy.findFirst({
          where: {
            tenantId: data.residentId,
            endDate: null, // Active tenancy
          },
          include: {
            room: {
              select: {
                propertyId: true,
              },
            },
          },
        });

        if (!tenancy) {
          return res.status(403).json({ 
            error: 'Cannot report incident: Resident has no active tenancy' 
          });
        }

        // Check if the support worker is assigned to this property
        const assignment = await prisma.assignment.findFirst({
          where: {
            userId: req.user.userId,
            propertyId: tenancy.room.propertyId,
            endDate: null, // Active assignment
          },
        });

        if (!assignment) {
          return res.status(403).json({ 
            error: 'You can only report incidents for residents in your assigned properties' 
          });
        }
      }
    }

    const incident = await prisma.incident.create({
      data: {
        organizationId: req.organizationId,
        residentId: data.residentId,
        reportedById: req.user.userId,
        incidentType: data.incidentType,
        severity: data.severity,
        title: data.title,
        description: data.description,
        location: data.location,
        witnessDetails: data.witnessDetails,
        actionsTaken: data.actionsTaken,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      },
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({ incident });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

/**
 * PATCH /api/incidents/:id
 * Update an incident
 */
router.patch('/:id', authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const validation = updateIncidentSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    // Verify incident belongs to organization
    const existing = await prisma.incident.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...('status' in data && { status: data.status }),
        ...('actionsTaken' in data && { actionsTaken: data.actionsTaken }),
        ...('followUpRequired' in data && { followUpRequired: data.followUpRequired }),
        ...('followUpNotes' in data && { followUpNotes: data.followUpNotes }),
        ...('resolvedBy' in data && { resolvedBy: data.resolvedBy }),
      },
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ incident });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

/**
 * POST /api/incidents/:id/resolve
 * Mark an incident as resolved
 */
router.post('/:id/resolve', authorize('ADMIN', 'OPS', 'ORG_ADMIN', 'COMPLIANCE_OFFICER'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { actionsTaken, followUpRequired, followUpNotes } = req.body;

    // Verify incident belongs to organization
    const existing = await prisma.incident.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        actionsTaken: actionsTaken || existing.actionsTaken,
        followUpRequired: followUpRequired || false,
        followUpNotes: followUpNotes || null,
        resolvedAt: new Date(),
        resolvedBy: req.user?.userId,
      },
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reporter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({ incident });
  } catch (error) {
    console.error('Resolve incident error:', error);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

export default router;
