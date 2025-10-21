import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate } from '../middleware/auth';
import { tenantContext, type TenantRequest, withTenantScope } from '../middleware/tenantContext';

const router = Router();

// Apply authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/support/dashboard
 * Get support worker dashboard statistics
 * Scoped to properties the support worker is assigned to
 */
router.get('/dashboard', async (req: TenantRequest, res) => {
  try {
    const { userId, role } = req.user!;

    // Only support workers can access this endpoint
    if (role !== 'SUPPORT') {
      return res.status(403).json({ error: 'This endpoint is for support workers only' });
    }

    // Get assigned properties
    const assignedProperties = await prisma.property.findMany({
      where: withTenantScope(req, {
        assignments: {
          some: {
            userId,
            endDate: null,
          },
        },
      }),
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    const propertyIds = assignedProperties.map(p => p.id);

    // If no properties assigned, return empty stats
    if (propertyIds.length === 0) {
      return res.json({
        summary: {
          assignedProperties: 0,
          totalResidents: 0,
          activeIncidents: 0,
          criticalIncidents: 0,
          pendingDocuments: 0,
          overdueCompliance: 0,
        },
        assignedProperties: [],
        recentIncidents: [],
        residentAlerts: [],
      });
    }

    // Get residents in assigned properties
    const residents = await prisma.tenant.findMany({
      where: withTenantScope(req, {
        tenancies: {
          some: {
            isActive: true,
            room: {
              propertyId: { in: propertyIds },
            },
          },
        },
      }),
      include: {
        tenancies: {
          where: { isActive: true },
          include: {
            room: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            documents: {
              where: { status: 'PENDING' },
            },
          },
        },
      },
    });

    const residentIds = residents.map(r => r.id);

    // Get incident stats
    const [
      totalIncidents,
      activeIncidents,
      criticalIncidents,
    ] = await Promise.all([
      prisma.incident.count({
        where: withTenantScope(req, {
          residentId: { in: residentIds },
        }),
      }),
      prisma.incident.count({
        where: withTenantScope(req, {
          residentId: { in: residentIds },
          status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] as any },
        }),
      }),
      prisma.incident.count({
        where: withTenantScope(req, {
          residentId: { in: residentIds },
          severity: 'CRITICAL' as any,
          status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] as any },
        }),
      }),
    ]);

    // Get pending documents count
    const pendingDocuments = await prisma.document.count({
      where: {
        tenantId: { in: residentIds },
        status: 'PENDING',
      },
    });

    // Get recent incidents (last 10)
    const recentIncidents = await prisma.incident.findMany({
      where: withTenantScope(req, {
        residentId: { in: residentIds },
      }),
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: 10,
    });

    // Get resident alerts (residents with pending docs or critical incidents)
    const residentAlerts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      property: string;
      alertType: 'PENDING_DOCUMENTS' | 'CRITICAL_INCIDENT';
      alertCount: number;
    }> = residents
      .filter(r => r._count.documents > 0)
      .map(r => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        property: r.tenancies[0]?.room.property.name,
        alertType: 'PENDING_DOCUMENTS' as const,
        alertCount: r._count.documents,
      }));

    // Add critical incident alerts
    const criticalIncidentResidents = await prisma.incident.findMany({
      where: withTenantScope(req, {
        residentId: { in: residentIds },
        severity: 'CRITICAL' as any,
        status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] as any },
      }),
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            tenancies: {
              where: { isActive: true },
              select: {
                room: {
                  select: {
                    property: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      distinct: ['residentId'] as any,
    });

    criticalIncidentResidents.forEach(incident => {
      if (incident.resident) {
        residentAlerts.push({
          id: incident.resident.id,
          firstName: incident.resident.firstName,
          lastName: incident.resident.lastName,
          property: incident.resident.tenancies[0]?.room.property.name || 'Unknown',
          alertType: 'CRITICAL_INCIDENT' as const,
          alertCount: 1,
        });
      }
    });

    res.json({
      summary: {
        assignedProperties: assignedProperties.length,
        totalResidents: residents.length,
        activeIncidents,
        criticalIncidents,
        pendingDocuments,
        overdueCompliance: 0, // TODO: Add compliance tracking for support workers
      },
      assignedProperties,
      recentIncidents,
      residentAlerts,
    });
  } catch (error) {
    console.error('Support dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch support dashboard data' });
  }
});

export default router;
