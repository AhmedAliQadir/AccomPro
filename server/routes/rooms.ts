import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role, userId } = req.user!;

    let rooms;
    if (role === 'SUPPORT') {
      rooms = await prisma.room.findMany({
        where: {
          property: {
            assignments: {
              some: {
                userId,
                endDate: null,
              },
            },
          },
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              tenancies: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: [
          { property: { name: 'asc' } },
          { roomNumber: 'asc' },
        ],
      });
    } else {
      rooms = await prisma.room.findMany({
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          _count: {
            select: {
              tenancies: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: [
          { property: { name: 'asc' } },
          { roomNumber: 'asc' },
        ],
      });
    }

    res.json({ rooms });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

export default router;
