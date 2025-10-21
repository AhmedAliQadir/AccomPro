import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenancies,
      totalProperties,
      totalRooms,
      pendingDocuments,
      verifiedDocuments,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenancy.count({ where: { isActive: true } }),
      prisma.property.count(),
      prisma.room.count(),
      prisma.document.count({ where: { status: 'PENDING' } }),
      prisma.document.count({ where: { status: 'VERIFIED' } }),
    ]);

    const occupancy = await prisma.room.findMany({
      select: {
        id: true,
        capacity: true,
        _count: {
          select: {
            tenancies: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    const occupiedRooms = occupancy.filter(r => r._count.tenancies > 0).length;
    const availableRooms = totalRooms - occupiedRooms;

    res.json({
      summary: {
        totalTenants,
        activeTenancies,
        pendingDocuments,
        verifiedDocuments,
        totalProperties,
        totalRooms,
        occupiedRooms,
        availableRooms,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/occupancy', authorize('ADMIN', 'OPS'), async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      include: {
        rooms: {
          include: {
            _count: {
              select: {
                tenancies: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    const occupancyData = properties.map(property => {
      const totalRooms = property.rooms.length;
      const occupiedRooms = property.rooms.filter(r => r._count.tenancies > 0).length;
      const occupancyRate = totalRooms > 0 
        ? Math.round((occupiedRooms / totalRooms) * 100) 
        : 0;

      return {
        propertyId: property.id,
        propertyName: property.name,
        totalRooms,
        occupiedRooms,
        occupancyRate,
      };
    });

    res.json({ occupancy: occupancyData });
  } catch (error) {
    console.error('Occupancy report error:', error);
    res.status(500).json({ error: 'Failed to fetch occupancy report' });
  }
});

router.get('/compliance', authorize('ADMIN', 'OPS'), async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        documents: {
          select: {
            type: true,
            status: true,
            isMandatory: true,
          },
        },
      },
    });

    const complianceData = tenants.map(tenant => {
      const totalDocuments = tenant.documents.length;
      const verifiedDocuments = tenant.documents.filter(d => d.status === 'VERIFIED').length;
      const pendingDocuments = tenant.documents.filter(d => d.status === 'PENDING').length;
      const rejectedDocuments = tenant.documents.filter(d => d.status === 'REJECTED').length;
      
      const complianceRate = totalDocuments > 0 
        ? Math.round((verifiedDocuments / totalDocuments) * 100)
        : 0;

      return {
        tenantId: tenant.id,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        totalDocuments,
        verifiedDocuments,
        pendingDocuments,
        rejectedDocuments,
        complianceRate,
      };
    });

    res.json({ compliance: complianceData });
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance report' });
  }
});

export default router;
