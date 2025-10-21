import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Apply authentication - all admin routes require ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Get cross-organization dashboard statistics for Platform Admin
 * Aggregates data across all organizations
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Get all organization counts
    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      totalProperties,
      totalTenants,
      totalIncidents,
      totalCompliance,
      totalStaff,
      criticalIncidents,
      overdueCompliance,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.property.count(),
      prisma.tenant.count(),
      prisma.incident.count(),
      prisma.compliance.count(),
      prisma.staff.count(),
      prisma.incident.count({
        where: {
          severity: 'CRITICAL',
          status: { in: ['REPORTED', 'UNDER_INVESTIGATION'] },
        },
      }),
      prisma.compliance.count({
        where: { status: 'OVERDUE' },
      }),
    ]);

    // Get organization breakdown with stats
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        isActive: true,
        _count: {
          select: {
            users: true,
            properties: true,
            residents: true,
            incidents: true,
            compliance: true,
            staff: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get incidents by severity across all orgs
    const incidentsBySeverity = await prisma.incident.groupBy({
      by: ['severity'],
      _count: true,
    });

    // Get compliance by status across all orgs
    const complianceByStatus = await prisma.compliance.groupBy({
      by: ['status'],
      _count: true,
    });

    // Get recent critical incidents across all organizations
    const recentCriticalIncidents = await prisma.incident.findMany({
      where: {
        severity: 'CRITICAL',
      },
      include: {
        resident: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        reportedAt: 'desc',
      },
      take: 10,
    });

    // Get recent activity across all organizations (audit logs)
    const recentActivity = await prisma.auditLog.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      summary: {
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        totalProperties,
        totalTenants,
        totalIncidents,
        totalCompliance,
        totalStaff,
        criticalIncidents,
        overdueCompliance,
      },
      organizations,
      incidentsBySeverity: incidentsBySeverity.map((item) => ({
        severity: item.severity,
        count: item._count,
      })),
      complianceByStatus: complianceByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      recentCriticalIncidents,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch admin dashboard data' });
  }
});

export default router;
