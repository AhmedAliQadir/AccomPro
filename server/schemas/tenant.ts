import { z } from 'zod';
import { TenantStatus } from '@prisma/client';

export const createTenantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().or(z.date()).transform(val => new Date(val)),
  nationalId: z.string().optional(),
  supportLevel: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export const createTenancySchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  startDate: z.string().or(z.date()).transform(val => new Date(val)),
  endDate: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  rentAmount: z.number().positive().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateTenancyInput = z.infer<typeof createTenancySchema>;
