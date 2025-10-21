import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      totalProperties,
      totalRooms,
      activeCases,
      pendingDocuments,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.property.count(),
      prisma.room.count(),
      prisma.tenant.count({ where: { status: 'PENDING' } }),
      prisma.document.count({ where: { status: 'PENDING' } }),
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
    const occupancyRate = totalRooms > 0 
      ? Math.round((occupiedRooms / totalRooms) * 100) 
      : 0;

    res.json({
      summary: {
        totalTenants,
        activeTenants,
        totalProperties,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        activeCases,
        pendingDocuments,
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
      const mandatoryDocs = tenant.documents.filter(d => d.isMandatory);
      const verifiedDocs = mandatoryDocs.filter(d => d.status === 'VERIFIED');
      const pendingDocs = mandatoryDocs.filter(d => d.status === 'PENDING');
      
      const isCompliant = mandatoryDocs.length > 0 && 
        mandatoryDocs.every(d => d.status === 'VERIFIED');

      return {
        tenantId: tenant.id,
        tenantName: `${tenant.firstName} ${tenant.lastName}`,
        status: tenant.status,
        totalDocs: tenant.documents.length,
        mandatoryDocs: mandatoryDocs.length,
        verifiedDocs: verifiedDocs.length,
        pendingDocs: pendingDocs.length,
        isCompliant,
      };
    });

    res.json({ compliance: complianceData });
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({ error: 'Failed to fetch compliance report' });
  }
});

export default router;
