import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createAuditLog, AuditableRequest } from '../middleware/audit';
import { createTenantSchema, updateTenantSchema, createTenancySchema } from '../schemas/tenant';
import { DocumentType } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(createAuditLog());

async function checkTenantReadyForTenancy(tenantId: string): Promise<boolean> {
  const mandatoryDocs = await prisma.document.findMany({
    where: {
      tenantId,
      isMandatory: true,
    },
  });

  const allVerified = mandatoryDocs.every(doc => doc.status === 'VERIFIED');
  const hasProofOfId = mandatoryDocs.some(doc => doc.type === 'PROOF_OF_ID' && doc.status === 'VERIFIED');
  const hasProofOfIncome = mandatoryDocs.some(doc => doc.type === 'PROOF_OF_INCOME' && doc.status === 'VERIFIED');

  return allVerified && hasProofOfId && hasProofOfIncome;
}

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, search } = req.query;
    const { role, userId } = req.user!;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role === 'SUPPORT') {
      where.tenancies = {
        some: {
          isActive: true,
          room: {
            property: {
              assignments: {
                some: {
                  userId,
                  endDate: null,
                },
              },
            },
          },
        },
      };
    }

    const tenants = await prisma.tenant.findMany({
      where,
      include: {
        tenancies: {
          where: { isActive: true },
          include: {
            room: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tenants });
  } catch (error) {
    console.error('Fetch tenants error:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        tenancies: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            fileName: true,
            fileSize: true,
            uploadedAt: true,
            verifiedAt: true,
            isMandatory: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (role === 'SUPPORT') {
      const activeTenancy = tenant.tenancies.find(t => t.isActive);
      if (!activeTenancy) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: activeTenancy.room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied to this tenant' });
      }
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Fetch tenant error:', error);
    res.status(500).json({ error: 'Failed to fetch tenant' });
  }
});

router.post('/', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(createTenantSchema), async (req: AuditableRequest, res) => {
  try {
    const { 
      nationalId,
      // Profile fields
      title,
      nationality,
      previousAddress,
      languagesSpoken,
      // Financial fields
      benefitType,
      benefitAmount,
      benefitFrequency,
      // Emergency contact fields
      nextOfKinName,
      nextOfKinRelationship,
      nextOfKinAddress,
      nextOfKinPhone,
      // Professional contacts
      doctorName,
      doctorPhone,
      hasProbationOfficer,
      probationOfficerName,
      probationOfficerPhone,
      ...coreFields
    } = req.body;
    
    // Helper function to convert empty strings to undefined
    const sanitize = (value: any) => (value === '' ? undefined : value);
    
    // Prepare core tenant data
    const tenantData: any = {
      firstName: coreFields.firstName,
      lastName: coreFields.lastName,
      email: sanitize(coreFields.email),
      phone: sanitize(coreFields.phone),
      dateOfBirth: coreFields.dateOfBirth,
      nationalInsuranceNumber: sanitize(nationalId),
    };
    
    if (tenantData.dateOfBirth && typeof tenantData.dateOfBirth === 'string') {
      tenantData.dateOfBirth = new Date(tenantData.dateOfBirth);
    }
    
    // Build nested creation data
    const createData: any = {
      ...tenantData,
    };
    
    // Always add profile if any fields are provided
    const hasProfileData = title || nationality || previousAddress || languagesSpoken;
    if (hasProfileData) {
      createData.profile = {
        create: {
          title: sanitize(title),
          nationality: sanitize(nationality),
          previousAddress: sanitize(previousAddress),
          languagesSpoken: sanitize(languagesSpoken),
        }
      };
    }
    
    // Always add finance if any financial fields provided
    const hasFinanceData = benefitType || benefitAmount || benefitFrequency;
    if (hasFinanceData) {
      createData.finance = {
        create: {
          benefitType: sanitize(benefitType),
          benefitAmount: benefitAmount,
          benefitFrequency: sanitize(benefitFrequency),
        }
      };
    }
    
    // Add emergency contact if name provided
    if (nextOfKinName && nextOfKinName.trim()) {
      createData.emergencyContacts = {
        create: [{
          name: nextOfKinName.trim(),
          relationship: sanitize(nextOfKinRelationship) || '',
          address: sanitize(nextOfKinAddress),
          phone: sanitize(nextOfKinPhone),
          isPrimary: true,
        }]
      };
    }
    
    // Always add risk assessment if any professional contact data provided
    const hasRiskData = doctorName || doctorPhone || hasProbationOfficer || probationOfficerName || probationOfficerPhone;
    if (hasRiskData) {
      createData.riskAssessment = {
        create: {
          doctorName: sanitize(doctorName),
          doctorPhone: sanitize(doctorPhone),
          hasProbationOfficer: hasProbationOfficer || false,
          probationOfficerName: sanitize(probationOfficerName),
          probationOfficerPhone: sanitize(probationOfficerPhone),
        }
      };
    }
    
    const tenant = await prisma.tenant.create({
      data: createData,
      include: {
        profile: true,
        finance: true,
        emergencyContacts: true,
        riskAssessment: true,
      }
    });

    req.auditLog = {
      action: 'CREATE_TENANT',
      entityType: 'Tenant',
      entityId: tenant.id,
      changes: req.body,
    };

    res.status(201).json({ tenant });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

router.patch('/:id', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(updateTenantSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { nationalId, ...rest } = req.body;
    const data: any = { ...rest };
    
    if (data.dateOfBirth && typeof data.dateOfBirth === 'string') {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    
    if (nationalId !== undefined) {
      data.nationalInsuranceNumber = nationalId;
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    });

    req.auditLog = {
      action: 'UPDATE_TENANT',
      entityType: 'Tenant',
      entityId: tenant.id,
      changes: req.body,
    };

    res.json({ tenant });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

router.post('/:tenantId/tenancies', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(createTenancySchema), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { tenantId } = req.params;
    const { roomId, startDate } = req.body;
    const { role, userId } = req.user!;

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        tenancies: {
          where: { isActive: true },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (role === 'SUPPORT') {
      const hasAccess = await prisma.assignment.findFirst({
        where: {
          userId,
          propertyId: room.propertyId,
          endDate: null,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied: You can only create tenancies for rooms in your assigned properties' });
      }
    }

    if (room.tenancies.length >= room.capacity) {
      return res.status(400).json({ error: 'Room is at full capacity' });
    }

    const overlappingTenancies = await prisma.tenancy.findMany({
      where: {
        roomId,
        isActive: true,
        startDate: { lte: new Date(startDate) },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(startDate) } },
        ],
      },
    });

    if (overlappingTenancies.length >= room.capacity) {
      return res.status(400).json({ error: 'Overlapping tenancies exceed room capacity' });
    }

    const data = { ...req.body };
    
    if (data.startDate && typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate);
    }
    
    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate);
    }

    const tenancy = await prisma.tenancy.create({
      data,
    });

    req.auditLog = {
      action: 'CREATE_TENANCY',
      entityType: 'Tenancy',
      entityId: tenancy.id,
      changes: req.body,
    };

    res.status(201).json({ tenancy });
  } catch (error) {
    console.error('Create tenancy error:', error);
    res.status(500).json({ error: 'Failed to create tenancy' });
  }
});

router.post('/:tenantId/check-ready', async (req: AuditableRequest, res) => {
  try {
    const { tenantId } = req.params;

    const isReady = await checkTenantReadyForTenancy(tenantId);

    if (isReady) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'READY_FOR_TENANCY' },
      });

      req.auditLog = {
        action: 'MARK_TENANT_READY',
        entityType: 'Tenant',
        entityId: tenantId,
      };
    }

    res.json({ ready: isReady });
  } catch (error) {
    console.error('Check tenant ready error:', error);
    res.status(500).json({ error: 'Failed to check tenant status' });
  }
});

router.patch('/tenancies/:id/end', authorize('ADMIN', 'OPS'), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { endDate, endReason, endNotes } = req.body;
    const { userId } = req.user!;

    const tenancy = await prisma.tenancy.findUnique({
      where: { id },
      include: {
        tenant: true,
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!tenancy) {
      return res.status(404).json({ error: 'Tenancy not found' });
    }

    if (!tenancy.isActive) {
      return res.status(400).json({ error: 'Tenancy is already ended' });
    }

    const updatedTenancy = await prisma.tenancy.update({
      where: { id },
      data: {
        isActive: false,
        endDate: endDate ? new Date(endDate) : new Date(),
        endReason: endReason || 'Tenancy ended',
        endNotes,
        endedById: userId,
      },
      include: {
        tenant: true,
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    const hasOtherActiveTenancies = await prisma.tenancy.count({
      where: {
        tenantId: tenancy.tenantId,
        isActive: true,
        id: { not: id },
      },
    });

    if (hasOtherActiveTenancies === 0) {
      await prisma.tenant.update({
        where: { id: tenancy.tenantId },
        data: { status: 'MOVED_OUT' },
      });
    }

    req.auditLog = {
      action: 'END_TENANCY',
      entityType: 'Tenancy',
      entityId: id,
      changes: {
        endDate: endDate || new Date(),
        endReason,
        endNotes,
        isActive: false,
      },
    };

    res.json({ tenancy: updatedTenancy });
  } catch (error) {
    console.error('End tenancy error:', error);
    res.status(500).json({ error: 'Failed to end tenancy' });
  }
});

export default router;
