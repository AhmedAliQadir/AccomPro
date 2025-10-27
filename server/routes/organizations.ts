import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorizePlatformAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * GET /api/organizations
 * Get all organizations (Platform Admin only - Orbixio LTD staff)
 * Security: Only users with @accommodateme.com emails can access cross-organization data
 */
router.get('/', authorizePlatformAdmin, async (req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        subscriptionTier: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({ organizations });
  } catch (error) {
    console.error('Fetch organizations error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

/**
 * GET /api/organizations/:id
 * Get a single organization by ID (Platform Admin only - Orbixio LTD staff)
 * Security: Only users with @accommodateme.com emails can access cross-organization data
 */
router.get('/:id', authorizePlatformAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            properties: true,
            residents: true,
            documents: true,
            staff: true,
            incidents: true,
            compliance: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization });
  } catch (error) {
    console.error('Fetch organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

export default router;
