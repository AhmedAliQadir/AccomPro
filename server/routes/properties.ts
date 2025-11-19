import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createAuditLog, AuditableRequest } from '../middleware/audit';
import { tenantContext, withTenantScope, type TenantRequest } from '../middleware/tenantContext';
import { createPropertySchema, updatePropertySchema, createRoomSchema, updateRoomSchema } from '../schemas/property';

const router = Router();

router.use(authenticate);
router.use(tenantContext); // Add multi-tenant filtering
router.use(createAuditLog());

router.get('/', async (req: TenantRequest, res) => {
  try {
    const { role, userId } = req.user!;

    let properties;
    if (role === 'SUPPORT') {
      properties = await prisma.property.findMany({
        where: withTenantScope(req, {
          assignments: {
            some: {
              userId,
              endDate: null,
            },
          },
        }),
        include: {
          rooms: {
            include: {
              _count: {
                select: { tenancies: { where: { isActive: true } } },
              },
            },
          },
          _count: {
            select: { rooms: true },
          },
        },
      });
    } else {
      properties = await prisma.property.findMany({
        where: withTenantScope(req),
        include: {
          rooms: {
            include: {
              _count: {
                select: { tenancies: { where: { isActive: true } } },
              },
            },
          },
          _count: {
            select: { rooms: true },
          },
        },
      });
    }

    res.json({ properties });
  } catch (error) {
    console.error('Fetch properties error:', error);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const property = await prisma.property.findFirst({
      where: { 
        id,
        ...withTenantScope(req),
      },
      include: {
        rooms: {
          include: {
            _count: {
              select: { tenancies: { where: { isActive: true } } },
            },
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
          where: {
            endDate: null,
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (role === 'SUPPORT') {
      const hasAccess = property.assignments.some(a => a.userId === userId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this property' });
      }
    }

    res.json({ property });
  } catch (error) {
    console.error('Fetch property error:', error);
    res.status(500).json({ error: 'Failed to fetch property' });
  }
});

router.post('/', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), validate(createPropertySchema), async (req: AuditableRequest & TenantRequest, res) => {
  try {
    const isPlatformAdmin = req.user?.role === 'ADMIN';
    
    // Determine organizationId:
    // - Platform admins can specify organizationId in request body OR use their own
    // - Regular users must use their own organizationId
    let organizationId: string;
    
    if (isPlatformAdmin && req.body.organizationId) {
      // Platform admin specified which org to create for
      organizationId = req.body.organizationId;
    } else if (req.organizationId) {
      // Use the user's organization
      organizationId = req.organizationId;
    } else {
      return res.status(400).json({ 
        error: 'Organization ID required. Platform admins must specify organizationId in request body.' 
      });
    }

    // Extract staff assignment arrays
    const { organizationId: _omit, opsUserIds, supportUserIds, ...propertyData } = req.body;

    // Validate staff assignments belong to the same organization and have correct roles
    if (opsUserIds?.length || supportUserIds?.length) {
      const allUserIds = [...(opsUserIds || []), ...(supportUserIds || [])];
      
      const users = await prisma.user.findMany({
        where: {
          id: { in: allUserIds },
          organizationId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      // Validate OPS users have OPS role
      if (opsUserIds?.length) {
        const invalidOpsUsers = opsUserIds.filter((id: string) => {
          const user = users.find(u => u.id === id);
          return !user || user.role !== 'OPS';
        });
        if (invalidOpsUsers.length > 0) {
          return res.status(400).json({ 
            error: `Invalid OPS users: ${invalidOpsUsers.join(', ')}. Users must exist, belong to the organization, and have OPS role.` 
          });
        }
      }

      // Validate SUPPORT users have SUPPORT role
      if (supportUserIds?.length) {
        const invalidSupportUsers = supportUserIds.filter((id: string) => {
          const user = users.find(u => u.id === id);
          return !user || user.role !== 'SUPPORT';
        });
        if (invalidSupportUsers.length > 0) {
          return res.status(400).json({ 
            error: `Invalid SUPPORT users: ${invalidSupportUsers.join(', ')}. Users must exist, belong to the organization, and have SUPPORT role.` 
          });
        }
      }
    }

    // Create property and assignments in a transaction
    const property = await prisma.$transaction(async (tx) => {
      const newProperty = await tx.property.create({
        data: {
          ...propertyData,
          organizationId,
        },
      });

      // Create assignments for OPS users
      if (opsUserIds?.length) {
        await tx.assignment.createMany({
          data: opsUserIds.map((userId: string) => ({
            userId,
            propertyId: newProperty.id,
          })),
        });
      }

      // Create assignments for SUPPORT users
      if (supportUserIds?.length) {
        await tx.assignment.createMany({
          data: supportUserIds.map((userId: string) => ({
            userId,
            propertyId: newProperty.id,
          })),
        });
      }

      return newProperty;
    });

    req.auditLog = {
      action: 'CREATE_PROPERTY',
      entityType: 'Property',
      entityId: property.id,
      changes: { ...req.body, assignedStaff: { opsUserIds, supportUserIds } },
    };

    res.status(201).json({ property });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Failed to create property' });
  }
});

router.patch('/:id', authorize('ADMIN', 'OPS'), validate(updatePropertySchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.update({
      where: { id },
      data: req.body,
    });

    req.auditLog = {
      action: 'UPDATE_PROPERTY',
      entityType: 'Property',
      entityId: property.id,
      changes: req.body,
    };

    res.json({ property });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Failed to update property' });
  }
});

router.delete('/:id', authorize('ADMIN'), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            tenancies: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const activeTenanciesCount = property.rooms.reduce(
      (sum, room) => sum + room.tenancies.length,
      0
    );

    if (activeTenanciesCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete property with active tenancies',
        details: `This property has ${activeTenanciesCount} active tenancy/tenancies`,
      });
    }

    if (property.rooms.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete property with existing rooms',
        details: `This property has ${property.rooms.length} room(s). Please delete all rooms first.`,
      });
    }

    await prisma.property.delete({
      where: { id },
    });

    req.auditLog = {
      action: 'DELETE_PROPERTY',
      entityType: 'Property',
      entityId: id,
    };

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property' });
  }
});

router.post('/:propertyId/rooms', authorize('ADMIN', 'OPS'), validate(createRoomSchema), async (req: AuditableRequest, res) => {
  try {
    const { propertyId } = req.params;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const room = await prisma.room.create({
      data: {
        ...req.body,
        propertyId,
      },
    });

    req.auditLog = {
      action: 'CREATE_ROOM',
      entityType: 'Room',
      entityId: room.id,
      changes: req.body,
    };

    res.status(201).json({ room });
  } catch (error: any) {
    console.error('Create room error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Room number already exists in this property' });
    }
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.patch('/rooms/:roomId', authorize('ADMIN', 'OPS'), validate(updateRoomSchema), async (req: AuditableRequest, res) => {
  try {
    const { roomId } = req.params;

    const room = await prisma.room.update({
      where: { id: roomId },
      data: req.body,
    });

    req.auditLog = {
      action: 'UPDATE_ROOM',
      entityType: 'Room',
      entityId: room.id,
      changes: req.body,
    };

    res.json({ room });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

router.delete('/rooms/:roomId', authorize('ADMIN'), async (req: AuditableRequest, res) => {
  try {
    const { roomId } = req.params;

    const tenanciesCount = await prisma.tenancy.count({
      where: { roomId, isActive: true },
    });

    if (tenanciesCount > 0) {
      return res.status(400).json({ error: 'Cannot delete room with active tenancies' });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    req.auditLog = {
      action: 'DELETE_ROOM',
      entityType: 'Room',
      entityId: roomId,
    };

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

export default router;
