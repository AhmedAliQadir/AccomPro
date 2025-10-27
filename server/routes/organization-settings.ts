import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validation';

const router = Router();

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  billingContact: z.string().optional(),
  billingEmail: z.string().email().optional(),
  billingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
});

router.get('/settings', authenticate, authorize('ADMIN', 'OPS'), async (req: AuthRequest, res) => {
  try {
    const organizationId = req.user!.organizationId;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        contactEmail: true,
        contactPhone: true,
        address: true,
        postcode: true,
        subscriptionTier: true,
        billingContact: true,
        billingEmail: true,
        billingAddress: true,
        paymentMethod: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({ organization });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    res.status(500).json({ error: 'Failed to fetch organization settings' });
  }
});

router.patch(
  '/settings',
  authenticate,
  authorize('ADMIN'),
  validate(updateOrganizationSchema),
  async (req: AuthRequest, res) => {
    try {
      const organizationId = req.user!.organizationId;
      const data = req.body;

      const organization = await prisma.organization.update({
        where: { id: organizationId },
        data,
        select: {
          id: true,
          name: true,
          subdomain: true,
          contactEmail: true,
          contactPhone: true,
          address: true,
          postcode: true,
          subscriptionTier: true,
          billingContact: true,
          billingEmail: true,
          billingAddress: true,
          paymentMethod: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({ organization });
    } catch (error) {
      console.error('Error updating organization settings:', error);
      res.status(500).json({ error: 'Failed to update organization settings' });
    }
  }
);

export default router;
