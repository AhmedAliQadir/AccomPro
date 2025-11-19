import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';
import { tenantContext, withTenantScope, type TenantRequest } from '../middleware/tenantContext';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/users
 * Get users for staff assignment (filtered by role and organization)
 * Query params: ?role=OPS|SUPPORT (filter by role)
 */
router.get('/', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), async (req: TenantRequest, res) => {
  try {
    const { role } = req.query;
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    
    // Determine organizationId
    let organizationId: string | undefined;
    if (isPlatformAdmin && req.query.organizationId) {
      organizationId = req.query.organizationId as string;
    } else if (req.organizationId) {
      organizationId = req.organizationId;
    }

    const where: any = {};
    
    // Add organization filter
    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    // Add role filter if specified
    if (role === 'OPS' || role === 'SUPPORT') {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
