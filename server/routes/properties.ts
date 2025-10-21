import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createAuditLog, AuditableRequest } from '../middleware/audit';
import { createPropertySchema, updatePropertySchema, createRoomSchema, updateRoomSchema } from '../schemas/property';

const router = Router();

router.use(authenticate);
router.use(createAuditLog());

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;

    let properties;
    if (role === 'SUPPORT') {
      properties = await prisma.property.findMany({
        where: {
          assignments: {
            some: {
              userId,
              endDate: null,
            },
          },
        },
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

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const property = await prisma.property.findUnique({
      where: { id },
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

router.post('/', authorize('ADMIN', 'OPS'), validate(createPropertySchema), async (req: AuditableRequest, res) => {
  try {
    const property = await prisma.property.create({
      data: req.body,
    });

    req.auditLog = {
      action: 'CREATE_PROPERTY',
      entityType: 'Property',
      entityId: property.id,
      changes: req.body,
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

    const roomsCount = await prisma.room.count({
      where: { propertyId: id },
    });

    if (roomsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete property with existing rooms' });
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
