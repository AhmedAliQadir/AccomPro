import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorizePlatformAdmin, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createOrganizationSchema, updateOrganizationSchema } from '../schemas/organization';
import bcrypt from 'bcryptjs';

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

/**
 * POST /api/organizations
 * Create a new organization with initial admin user (Platform Admin only)
 * Security: Only Platform Admins can create organizations
 * Uses transaction to ensure both organization and admin user are created atomically
 */
router.post('/', authorizePlatformAdmin, validate(createOrganizationSchema), async (req: AuthRequest, res) => {
  try {
    const { organization, initialAdmin } = req.body;

    // Check if subdomain is already taken
    const existingOrg = await prisma.organization.findUnique({
      where: { subdomain: organization.subdomain },
    });

    if (existingOrg) {
      return res.status(409).json({ error: 'Subdomain already exists' });
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: initialAdmin.email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash the password for the initial admin user
    const hashedPassword = await bcrypt.hash(initialAdmin.password, 10);

    // Create organization and initial admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the organization
      const newOrganization = await tx.organization.create({
        data: {
          name: organization.name,
          subdomain: organization.subdomain,
          contactEmail: organization.contactEmail,
          contactPhone: organization.contactPhone || null,
          address: organization.address || null,
          postcode: organization.postcode || null,
          subscriptionTier: organization.subscriptionTier,
          billingContact: organization.billingContact || null,
          billingEmail: organization.billingEmail || null,
          billingAddress: organization.billingAddress || null,
          paymentMethod: organization.paymentMethod || null,
        },
      });

      // Create the initial admin user
      const newAdmin = await tx.user.create({
        data: {
          organizationId: newOrganization.id,
          email: initialAdmin.email,
          password: hashedPassword,
          firstName: initialAdmin.firstName,
          lastName: initialAdmin.lastName,
          role: 'ADMIN', // Set as organization admin
          isPlatformAdmin: false, // Not a platform admin
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId: newOrganization.id,
          userId: req.user!.userId,
          action: 'CREATE_ORGANIZATION',
          entityType: 'Organization',
          entityId: newOrganization.id,
          changes: {
            organizationName: newOrganization.name,
            adminEmail: newAdmin.email,
            createdBy: req.user!.email,
          },
        },
      });

      return { organization: newOrganization, adminUser: newAdmin };
    });

    res.status(201).json({
      message: 'Organization created successfully',
      organization: result.organization,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        firstName: result.adminUser.firstName,
        lastName: result.adminUser.lastName,
      },
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

/**
 * PUT /api/organizations/:id
 * Update organization details (Platform Admin only)
 * Security: Only Platform Admins can edit any organization
 */
router.put('/:id', authorizePlatformAdmin, validate(updateOrganizationSchema), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id },
    });

    if (!existingOrg) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // If subdomain is being changed, check if it's available
    if (updates.subdomain && updates.subdomain !== existingOrg.subdomain) {
      const subdomainTaken = await prisma.organization.findUnique({
        where: { subdomain: updates.subdomain },
      });

      if (subdomainTaken) {
        return res.status(409).json({ error: 'Subdomain already exists' });
      }
    }

    // Update organization and create audit log in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrganization = await tx.organization.update({
        where: { id },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.subdomain && { subdomain: updates.subdomain }),
          ...(updates.contactEmail && { contactEmail: updates.contactEmail }),
          ...(updates.contactPhone !== undefined && { contactPhone: updates.contactPhone || null }),
          ...(updates.address !== undefined && { address: updates.address || null }),
          ...(updates.postcode !== undefined && { postcode: updates.postcode || null }),
          ...(updates.subscriptionTier && { subscriptionTier: updates.subscriptionTier }),
          ...(updates.billingContact !== undefined && { billingContact: updates.billingContact || null }),
          ...(updates.billingEmail !== undefined && { billingEmail: updates.billingEmail || null }),
          ...(updates.billingAddress !== undefined && { billingAddress: updates.billingAddress || null }),
          ...(updates.paymentMethod !== undefined && { paymentMethod: updates.paymentMethod || null }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive }),
        },
      });

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          organizationId: id,
          userId: req.user!.userId,
          action: 'UPDATE_ORGANIZATION',
          entityType: 'Organization',
          entityId: id,
          changes: {
            before: existingOrg,
            after: updates,
            updatedBy: req.user!.email,
          },
        },
      });

      return updatedOrganization;
    });

    res.json({
      message: 'Organization updated successfully',
      organization: result,
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

export default router;
