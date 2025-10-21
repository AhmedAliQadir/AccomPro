import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticate, authorize } from '../middleware/auth';
import { tenantContext, withTenantScope, type TenantRequest } from '../middleware/tenantContext';
import { z } from 'zod';

const router = Router();

// Apply authentication and tenant context to all routes
router.use(authenticate);
router.use(tenantContext);

// Validation schemas
const createStaffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().min(1),
  dbsNumber: z.string().optional(),
  dbsExpiryDate: z.string().optional(),
  dbsCheckDate: z.string().optional(),
  startDate: z.string(),
  trainingRecords: z.array(z.object({
    courseName: z.string(),
    completedDate: z.string(),
    expiryDate: z.string().optional(),
  })).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  }).optional(),
  notes: z.string().optional(),
});

const updateStaffSchema = createStaffSchema.partial();

/**
 * GET /api/staff
 * Get all staff members for the current organization
 * Query params: ?active=true (filter active staff)
 */
router.get('/', async (req: TenantRequest, res) => {
  try {
    const { active } = req.query;

    const where = withTenantScope(req, {
      ...(active === 'true' ? { isActive: true } : {}),
    });

    const staff = await prisma.staff.findMany({
      where,
      orderBy: [
        { isActive: 'desc' },
        { lastName: 'asc' },
      ],
    });

    res.json({ staff });
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

/**
 * GET /api/staff/dbs-expiring
 * Get staff with DBS checks expiring soon (within 60 days)
 */
router.get('/dbs-expiring', async (req: TenantRequest, res) => {
  try {
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const staff = await prisma.staff.findMany({
      where: {
        ...withTenantScope(req),
        isActive: true,
        dbsExpiryDate: {
          lte: sixtyDaysFromNow,
          gte: new Date(), // Not already expired
        },
      },
      orderBy: {
        dbsExpiryDate: 'asc',
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error('Fetch DBS expiring error:', error);
    res.status(500).json({ error: 'Failed to fetch DBS expiring staff' });
  }
});

/**
 * GET /api/staff/:id
 * Get a single staff member by ID
 */
router.get('/:id', async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;

    const staff = await prisma.staff.findFirst({
      where: {
        id,
        ...withTenantScope(req),
      },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ staff });
  } catch (error) {
    console.error('Fetch staff error:', error);
    res.status(500).json({ error: 'Failed to fetch staff member' });
  }
});

/**
 * POST /api/staff
 * Create a new staff member
 */
router.post('/', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), async (req: TenantRequest, res) => {
  try {
    const validation = createStaffSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    if (!req.organizationId) {
      return res.status(403).json({ error: 'Organization context required' });
    }

    const staff = await prisma.staff.create({
      data: {
        organizationId: req.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        dbsNumber: data.dbsNumber,
        dbsExpiryDate: data.dbsExpiryDate ? new Date(data.dbsExpiryDate) : null,
        dbsCheckDate: data.dbsCheckDate ? new Date(data.dbsCheckDate) : null,
        startDate: new Date(data.startDate),
        trainingRecords: data.trainingRecords || [],
        emergencyContact: data.emergencyContact || null,
        notes: data.notes,
      },
    });

    res.status(201).json({ staff });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
});

/**
 * PATCH /api/staff/:id
 * Update a staff member
 */
router.patch('/:id', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const validation = updateStaffSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const data = validation.data;

    // Verify staff belongs to organization
    const existing = await prisma.staff.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.jobTitle && { jobTitle: data.jobTitle }),
        ...(data.dbsNumber !== undefined && { dbsNumber: data.dbsNumber }),
        ...(data.dbsExpiryDate !== undefined && { 
          dbsExpiryDate: data.dbsExpiryDate ? new Date(data.dbsExpiryDate) : null 
        }),
        ...(data.dbsCheckDate !== undefined && { 
          dbsCheckDate: data.dbsCheckDate ? new Date(data.dbsCheckDate) : null 
        }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.trainingRecords && { trainingRecords: data.trainingRecords }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
});

/**
 * POST /api/staff/:id/training
 * Add a training record to a staff member
 */
router.post('/:id/training', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { courseName, completedDate, expiryDate } = req.body;

    if (!courseName || !completedDate) {
      return res.status(400).json({ error: 'Course name and completion date required' });
    }

    // Verify staff belongs to organization
    const staff = await prisma.staff.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const trainingRecords = (staff.trainingRecords as any[]) || [];
    trainingRecords.push({
      courseName,
      completedDate,
      expiryDate: expiryDate || null,
      addedAt: new Date().toISOString(),
    });

    const updated = await prisma.staff.update({
      where: { id },
      data: { trainingRecords },
    });

    res.json({ staff: updated });
  } catch (error) {
    console.error('Add training error:', error);
    res.status(500).json({ error: 'Failed to add training record' });
  }
});

/**
 * PATCH /api/staff/:id/deactivate
 * Deactivate a staff member (set end date and isActive = false)
 */
router.patch('/:id/deactivate', authorize('ADMIN', 'OPS', 'ORG_ADMIN'), async (req: TenantRequest, res) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;

    // Verify staff belongs to organization
    const existing = await prisma.staff.findFirst({
      where: { id, ...withTenantScope(req) },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        endDate: endDate ? new Date(endDate) : new Date(),
      },
    });

    res.json({ staff });
  } catch (error) {
    console.error('Deactivate staff error:', error);
    res.status(500).json({ error: 'Failed to deactivate staff member' });
  }
});

export default router;
