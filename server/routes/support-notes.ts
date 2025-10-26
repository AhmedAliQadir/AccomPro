import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authorize, AuthRequest } from '../middleware/auth';
import { AuditableRequest } from '../middleware/audit';

const router = Router();

// Validation schemas
const createSupportNoteSchema = z.object({
  tenantId: z.string().uuid(),
  sessionDate: z.string().datetime().or(z.date()),
  contactType: z.enum(['IN_PERSON', 'PHONE_CALL']),
  attendanceStatus: z.enum(['PRESENT', 'AUTHORISED_NON_ATTENDANCE', 'DID_NOT_ATTEND']),
  economicWellbeingNotes: z.string().optional(),
  enjoyAchieveNotes: z.string().optional(),
  healthNotes: z.string().optional(),
  staySafeNotes: z.string().optional(),
  positiveContributionNotes: z.string().optional(),
  specificSupportNeeds: z.string().optional(),
  sessionComments: z.string().optional(),
  clientSignature: z.string().optional(),
  supportWorkerSignature: z.string().optional(),
  nextSessionDate: z.string().datetime().or(z.date()).optional(),
});

const updateSupportNoteSchema = createSupportNoteSchema.partial();

// GET /api/support-notes - List all support notes (filtered by organization and role)
router.get('/', authorize('ADMIN', 'OPS', 'SUPPORT'), async (req: AuthRequest, res) => {
  try {
    const { role, userId, organizationId } = req.user!;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    const where: any = { organizationId };

    // Support workers can only see notes for their assigned properties
    if (role === 'SUPPORT') {
      const assignments = await prisma.assignment.findMany({
        where: {
          userId,
          endDate: null,
        },
        select: { propertyId: true },
      });

      const propertyIds = assignments.map((a: any) => a.propertyId);

      // Get tenants in assigned properties
      const tenancies = await prisma.tenancy.findMany({
        where: {
          isActive: true,
          room: {
            propertyId: { in: propertyIds },
          },
        },
        select: { tenantId: true },
      });

      const tenantIds = Array.from(new Set(tenancies.map((t: any) => t.tenantId)));
      where.tenantId = { in: tenantIds };
    }

    const supportNotes = await prisma.supportNote.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        supportWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    res.json({ supportNotes });
  } catch (error) {
    console.error('List support notes error:', error);
    res.status(500).json({ error: 'Failed to fetch support notes' });
  }
});

// GET /api/support-notes/:id - Get a specific support note
router.get('/:id', authorize('ADMIN', 'OPS', 'SUPPORT'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, userId, organizationId } = req.user!;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    const supportNote = await prisma.supportNote.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        supportWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!supportNote) {
      return res.status(404).json({ error: 'Support note not found in your organization' });
    }

    // Support workers can only access notes for their assigned properties
    if (role === 'SUPPORT') {
      const tenancy = await prisma.tenancy.findFirst({
        where: {
          tenantId: supportNote.tenantId,
          isActive: true,
        },
        include: {
          room: true,
        },
      });

      // Require an active tenancy for SUPPORT role operations
      if (!tenancy) {
        return res.status(403).json({ 
          error: 'Access denied: Resident must have an active tenancy in an assigned property' 
        });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: tenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this support note' });
      }
    }

    res.json({ supportNote });
  } catch (error) {
    console.error('Get support note error:', error);
    res.status(500).json({ error: 'Failed to fetch support note' });
  }
});

// POST /api/support-notes - Create a new support note
router.post('/', authorize('ADMIN', 'OPS', 'SUPPORT'), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { userId, organizationId, role } = req.user!;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    // Validate request body
    const validation = createSupportNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid support note data', 
        details: validation.error.errors 
      });
    }

    const data: any = { ...validation.data };
    
    // Convert date strings to Date objects
    if (data.sessionDate && typeof data.sessionDate === 'string') {
      data.sessionDate = new Date(data.sessionDate);
    }
    if (data.nextSessionDate && typeof data.nextSessionDate === 'string') {
      data.nextSessionDate = new Date(data.nextSessionDate);
    }

    // Verify tenant belongs to organization
    const tenant = await prisma.tenant.findFirst({
      where: {
        id: data.tenantId,
        organizationId,
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found in your organization' });
    }

    // For SUPPORT role, verify they're assigned to the tenant's property
    if (role === 'SUPPORT') {
      const tenancy = await prisma.tenancy.findFirst({
        where: {
          tenantId: data.tenantId,
          isActive: true,
        },
        include: {
          room: true,
        },
      });

      // Require an active tenancy for SUPPORT role operations
      if (!tenancy) {
        return res.status(403).json({ 
          error: 'Access denied: Resident must have an active tenancy in an assigned property' 
        });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: tenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied: You can only create support notes for residents in your assigned properties' 
        });
      }
    }

    // Create support note
    const supportNote = await prisma.supportNote.create({
      data: {
        ...data,
        organizationId,
        supportWorkerId: userId,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        supportWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    req.auditLog = {
      action: 'CREATE_SUPPORT_NOTE',
      entityType: 'SupportNote',
      entityId: supportNote.id,
      changes: req.body,
    };

    res.status(201).json({ supportNote });
  } catch (error) {
    console.error('Create support note error:', error);
    res.status(500).json({ error: 'Failed to create support note' });
  }
});

// PATCH /api/support-notes/:id - Update a support note
router.patch('/:id', authorize('ADMIN', 'OPS', 'SUPPORT'), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role, userId } = req.user!;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    // Validate request body
    const validation = updateSupportNoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid support note data', 
        details: validation.error.errors 
      });
    }

    // Prevent tenantId changes - notes cannot be reassigned to different residents
    if (validation.data.tenantId) {
      return res.status(400).json({ 
        error: 'Changing the resident (tenantId) is not allowed. Create a new support note instead.' 
      });
    }

    // Verify support note exists and belongs to organization
    const existing = await prisma.supportNote.findFirst({
      where: { id, organizationId },
      include: {
        tenant: {
          include: {
            tenancies: {
              where: { isActive: true },
              include: { room: true },
            },
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Support note not found in your organization' });
    }

    // For SUPPORT role, verify they're assigned to the tenant's property
    if (role === 'SUPPORT') {
      const activeTenancy = existing.tenant.tenancies[0];
      
      // Require an active tenancy for SUPPORT role operations
      if (!activeTenancy) {
        return res.status(403).json({ 
          error: 'Access denied: Resident must have an active tenancy in an assigned property' 
        });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: activeTenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied: You can only edit support notes for residents in your assigned properties' 
        });
      }
    }

    const data: any = { ...validation.data };
    
    // Convert date strings to Date objects
    if (data.sessionDate && typeof data.sessionDate === 'string') {
      data.sessionDate = new Date(data.sessionDate);
    }
    if (data.nextSessionDate && typeof data.nextSessionDate === 'string') {
      data.nextSessionDate = new Date(data.nextSessionDate);
    }

    const supportNote = await prisma.supportNote.update({
      where: { id },
      data,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        supportWorker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    req.auditLog = {
      action: 'UPDATE_SUPPORT_NOTE',
      entityType: 'SupportNote',
      entityId: supportNote.id,
      changes: req.body,
    };

    res.json({ supportNote });
  } catch (error) {
    console.error('Update support note error:', error);
    res.status(500).json({ error: 'Failed to update support note' });
  }
});

// DELETE /api/support-notes/:id - Delete a support note
router.delete('/:id', authorize('ADMIN', 'OPS'), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { organizationId, role, userId } = req.user!;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    // Verify support note exists and belongs to organization
    const existing = await prisma.supportNote.findFirst({
      where: { id, organizationId },
      include: {
        tenant: {
          include: {
            tenancies: {
              where: { isActive: true },
              include: { room: true },
            },
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Support note not found in your organization' });
    }

    // For SUPPORT role (if they ever get delete permission), verify assignment
    if (role === 'SUPPORT') {
      const activeTenancy = existing.tenant.tenancies[0];
      
      // Require an active tenancy for SUPPORT role operations
      if (!activeTenancy) {
        return res.status(403).json({ 
          error: 'Access denied: Resident must have an active tenancy in an assigned property' 
        });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: activeTenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied: You can only delete support notes for residents in your assigned properties' 
        });
      }
    }

    await prisma.supportNote.delete({
      where: { id },
    });

    req.auditLog = {
      action: 'DELETE_SUPPORT_NOTE',
      entityType: 'SupportNote',
      entityId: id,
    };

    res.json({ message: 'Support note deleted successfully' });
  } catch (error) {
    console.error('Delete support note error:', error);
    res.status(500).json({ error: 'Failed to delete support note' });
  }
});

export default router;
