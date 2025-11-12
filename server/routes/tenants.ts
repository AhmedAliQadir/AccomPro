import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createAuditLog, AuditableRequest } from '../middleware/audit';
import { createTenantSchema, updateTenantSchema, createTenancySchema } from '../schemas/tenant';
import { 
  tenantProfileSchema,
  riskAssessmentSchema,
  supportPlanSchema,
  financeSchema,
  consentSchema,
  missingPersonProfileSchema,
  inventoryLogSchema,
  serviceChargeRecordSchema,
  emergencyContactSchema,
} from '../schemas/onboarding';
import { DocumentType } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(createAuditLog());

// Helper function to retry database operations on connection errors
async function retryOnConnectionError<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's a Prisma connection error (P1017)
      const isConnectionError = error?.code === 'P1017' || 
                                error?.message?.includes('connection') ||
                                error?.message?.includes('Server has closed');
      
      if (isConnectionError && attempt < maxRetries) {
        console.log(`Database connection error, retrying (${attempt}/${maxRetries})...`);
        // Reconnect Prisma client
        await prisma.$connect();
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

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
    const { role, userId, organizationId } = req.user!;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    const where: any = {
      organizationId, // Always filter by organization
    };

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
    const { role, userId, organizationId } = req.user!;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { 
        id,
        organizationId, // Ensure tenant belongs to user's organization
      },
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
    
    // Get organizationId from authenticated user
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    // Prepare core tenant data
    const tenantData: any = {
      firstName: coreFields.firstName,
      lastName: coreFields.lastName,
      email: sanitize(coreFields.email),
      phone: sanitize(coreFields.phone),
      dateOfBirth: coreFields.dateOfBirth,
      nationalInsuranceNumber: sanitize(nationalId),
      organizationId,
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
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    // Verify tenant belongs to user's organization
    const existing = await prisma.tenant.findFirst({
      where: { id, organizationId },
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Tenant not found in your organization' });
    }
    
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
    const { role, userId, organizationId } = req.user!;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    // Verify tenant belongs to user's organization
    const tenant = await prisma.tenant.findFirst({ 
      where: { 
        id: tenantId,
        organizationId,
      } 
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found in your organization' });
    }

    // Verify room belongs to user's organization
    const room = await prisma.room.findFirst({
      where: { 
        id: roomId,
        property: {
          organizationId,
        },
      },
      include: {
        tenancies: {
          where: { isActive: true },
        },
        property: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found in your organization' });
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

    // Check for overlapping active tenancies
    // A tenancy overlaps if:
    // 1. It's active
    // 2. It starts before or on the new tenancy's start date AND
    // 3. It either has no end date (ongoing) OR ends on or after the new tenancy's start date
    const proposedStartDate = new Date(startDate);
    const proposedEndDate = req.body.endDate ? new Date(req.body.endDate) : null;

    const overlappingTenancies = await prisma.tenancy.findMany({
      where: {
        roomId,
        isActive: true,
        OR: [
          // Existing tenancy that overlaps with the start of the new tenancy
          {
            startDate: { lte: proposedStartDate },
            OR: [
              { endDate: null }, // Ongoing tenancy
              { endDate: { gte: proposedStartDate } }, // Ends on or after new start
            ],
          },
          // Existing tenancy that starts during the new tenancy period
          proposedEndDate
            ? {
                startDate: { gte: proposedStartDate, lte: proposedEndDate },
              }
            : {
                startDate: { gte: proposedStartDate },
              },
        ],
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (overlappingTenancies.length >= room.capacity) {
      const occupantNames = overlappingTenancies
        .map((t) => `${t.tenant.firstName} ${t.tenant.lastName}`)
        .join(', ');
      return res.status(400).json({
        error: `Room ${room.roomNumber} is already occupied during this period. Current occupant(s): ${occupantNames}`,
      });
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
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    // Verify tenant belongs to user's organization
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, organizationId },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found in your organization' });
    }

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

// End tenancy route (accessible via /api/tenancies/:id/end)
router.patch('/:id/end', authorize('ADMIN', 'OPS'), async (req: AuthRequest & AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const { endDate, endReason, endNotes } = req.body;
    const { userId, organizationId } = req.user!;

    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }

    const tenancy = await prisma.tenancy.findFirst({
      where: { 
        id,
        tenant: {
          organizationId,
        },
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

// ============================================================
// COMPREHENSIVE ONBOARDING ENDPOINTS
// ============================================================

// ===== TENANT PROFILE =====
router.put('/:id/profile', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(tenantProfileSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() => 
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const profile = await retryOnConnectionError(() =>
      prisma.tenantProfile.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...req.body,
        },
        update: req.body,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_TENANT_PROFILE',
      entityType: 'TenantProfile',
      entityId: profile.id,
      changes: req.body,
    };
    
    res.json({ profile });
  } catch (error) {
    console.error('Update tenant profile error:', error);
    res.status(500).json({ error: 'Failed to update tenant profile' });
  }
});

// ===== RISK ASSESSMENT =====
router.put('/:id/risk-assessment', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(riskAssessmentSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const riskAssessment = await retryOnConnectionError(() =>
      prisma.tenantRiskAssessment.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...req.body,
        },
        update: req.body,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_RISK_ASSESSMENT',
      entityType: 'TenantRiskAssessment',
      entityId: riskAssessment.id,
      changes: req.body,
    };
    
    res.json({ riskAssessment });
  } catch (error) {
    console.error('Update risk assessment error:', error);
    res.status(500).json({ error: 'Failed to update risk assessment' });
  }
});

// ===== SUPPORT PLAN =====
router.put('/:id/support-plan', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(supportPlanSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Convert nextReviewDate string to Date object if present
    const data = { ...req.body };
    if (data.nextReviewDate && typeof data.nextReviewDate === 'string') {
      const parsedDate = new Date(data.nextReviewDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid nextReviewDate format' });
      }
      data.nextReviewDate = parsedDate;
    }
    
    const supportPlan = await retryOnConnectionError(() =>
      prisma.tenantSupportPlan.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...data,
        },
        update: data,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_SUPPORT_PLAN',
      entityType: 'TenantSupportPlan',
      entityId: supportPlan.id,
      changes: req.body,
    };
    
    res.json({ supportPlan });
  } catch (error) {
    console.error('Update support plan error:', error);
    res.status(500).json({ error: 'Failed to update support plan' });
  }
});

// ===== FINANCE =====
router.put('/:id/finance', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(financeSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const finance = await retryOnConnectionError(() =>
      prisma.tenantFinance.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...req.body,
        },
        update: req.body,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_FINANCE',
      entityType: 'TenantFinance',
      entityId: finance.id,
      changes: req.body,
    };
    
    res.json({ finance });
  } catch (error) {
    console.error('Update finance error:', error);
    res.status(500).json({ error: 'Failed to update finance' });
  }
});

// ===== CONSENTS =====
router.put('/:id/consents', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(consentSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Auto-set timestamps for signed consents
    const updateData: any = { ...req.body };
    const now = new Date();
    
    if (req.body.authorizationFormSigned) updateData.authorizationFormSignedAt = now;
    if (req.body.confidentialityWaiverSigned) updateData.confidentialityWaiverSignedAt = now;
    if (req.body.fireEvacuationAcknowledged) updateData.fireEvacuationAcknowledgedAt = now;
    if (req.body.licenceAgreementSigned) updateData.licenceAgreementSignedAt = now;
    if (req.body.missingPersonFormSigned) updateData.missingPersonFormSignedAt = now;
    if (req.body.nilIncomeFormSigned) updateData.nilIncomeFormSignedAt = now;
    if (req.body.serviceChargeAgreementSigned) updateData.serviceChargeAgreementSignedAt = now;
    if (req.body.supportAgreementSigned) updateData.supportAgreementSignedAt = now;
    if (req.body.supportNeedsAssessmentSigned) updateData.supportNeedsAssessmentSignedAt = now;
    if (req.body.photoIdConsentGiven) updateData.photoIdConsentGivenAt = now;
    
    const consents = await retryOnConnectionError(() =>
      prisma.tenantConsent.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...updateData,
        },
        update: updateData,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_CONSENTS',
      entityType: 'TenantConsent',
      entityId: consents.id,
      changes: req.body,
    };
    
    res.json({ consents });
  } catch (error) {
    console.error('Update consents error:', error);
    res.status(500).json({ error: 'Failed to update consents' });
  }
});

// ===== MISSING PERSON PROFILE =====
router.put('/:id/missing-person-profile', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(missingPersonProfileSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const missingPersonProfile = await retryOnConnectionError(() =>
      prisma.missingPersonProfile.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          ...req.body,
        },
        update: req.body,
      })
    );
    
    req.auditLog = {
      action: 'UPDATE_MISSING_PERSON_PROFILE',
      entityType: 'MissingPersonProfile',
      entityId: missingPersonProfile.id,
      changes: req.body,
    };
    
    res.json({ missingPersonProfile });
  } catch (error) {
    console.error('Update missing person profile error:', error);
    res.status(500).json({ error: 'Failed to update missing person profile' });
  }
});

// ===== INVENTORY LOGS =====
router.post('/:id/inventory-logs', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(inventoryLogSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const inventoryLog = await prisma.inventoryLog.create({
      data: {
        tenantId: id,
        ...req.body,
      },
    });
    
    req.auditLog = {
      action: 'CREATE_INVENTORY_LOG',
      entityType: 'InventoryLog',
      entityId: inventoryLog.id,
      changes: req.body,
    };
    
    res.status(201).json({ inventoryLog });
  } catch (error) {
    console.error('Create inventory log error:', error);
    res.status(500).json({ error: 'Failed to create inventory log' });
  }
});

router.get('/:id/inventory-logs', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: { tenantId: id },
      orderBy: { checkInDate: 'desc' },
    });
    
    res.json({ inventoryLogs });
  } catch (error) {
    console.error('Get inventory logs error:', error);
    res.status(500).json({ error: 'Failed to get inventory logs' });
  }
});

// ===== SERVICE CHARGE RECORDS =====
router.post('/:id/service-charges', authorize('ADMIN', 'OPS'), validate(serviceChargeRecordSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const serviceChargeRecord = await prisma.serviceChargeRecord.create({
      data: {
        tenantId: id,
        ...req.body,
      },
    });
    
    req.auditLog = {
      action: 'CREATE_SERVICE_CHARGE',
      entityType: 'ServiceChargeRecord',
      entityId: serviceChargeRecord.id,
      changes: req.body,
    };
    
    res.status(201).json({ serviceChargeRecord });
  } catch (error) {
    console.error('Create service charge error:', error);
    res.status(500).json({ error: 'Failed to create service charge' });
  }
});

router.get('/:id/service-charges', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await prisma.tenant.findFirst({
      where: { id, organizationId },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const serviceCharges = await prisma.serviceChargeRecord.findMany({
      where: { tenantId: id },
      orderBy: { weekStartDate: 'desc' },
    });
    
    res.json({ serviceCharges });
  } catch (error) {
    console.error('Get service charges error:', error);
    res.status(500).json({ error: 'Failed to get service charges' });
  }
});

// ===== EMERGENCY CONTACTS =====
router.post('/:id/emergency-contacts', authorize('ADMIN', 'OPS', 'SUPPORT'), validate(emergencyContactSchema), async (req: AuditableRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // If this contact is marked as primary, unset other primary contacts
    if (req.body.isPrimary) {
      await retryOnConnectionError(() =>
        prisma.tenantEmergencyContact.updateMany({
          where: { tenantId: id },
          data: { isPrimary: false },
        })
      );
    }
    
    const emergencyContact = await retryOnConnectionError(() =>
      prisma.tenantEmergencyContact.create({
        data: {
          tenantId: id,
          ...req.body,
        },
      })
    );
    
    req.auditLog = {
      action: 'CREATE_EMERGENCY_CONTACT',
      entityType: 'TenantEmergencyContact',
      entityId: emergencyContact.id,
      changes: req.body,
    };
    
    res.status(201).json({ emergencyContact });
  } catch (error) {
    console.error('Create emergency contact error:', error);
    res.status(500).json({ error: 'Failed to create emergency contact' });
  }
});

router.get('/:id/emergency-contacts', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user!.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization context required' });
    }
    
    const tenant = await retryOnConnectionError(() =>
      prisma.tenant.findFirst({
        where: { id, organizationId },
      })
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const emergencyContacts = await retryOnConnectionError(() =>
      prisma.tenantEmergencyContact.findMany({
        where: { tenantId: id },
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' },
        ],
      })
    );
    
    res.json({ emergencyContacts });
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: 'Failed to get emergency contacts' });
  }
});

export default router;
