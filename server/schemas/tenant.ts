import { z } from 'zod';
import { TenantStatus } from '@prisma/client';

export const createTenantSchema = z.object({
  // Core tenant fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().or(z.date()).transform(val => new Date(val)),
  nationalId: z.string().optional().or(z.literal('')),
  
  // Profile fields
  title: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  previousAddress: z.string().optional().or(z.literal('')),
  languagesSpoken: z.string().optional().or(z.literal('')),
  
  // Financial fields
  benefitType: z.string().optional().or(z.literal('')),
  benefitAmount: z.number().optional(),
  benefitFrequency: z.string().optional().or(z.literal('')),
  
  // Emergency contact fields
  nextOfKinName: z.string().optional().or(z.literal('')),
  nextOfKinRelationship: z.string().optional().or(z.literal('')),
  nextOfKinAddress: z.string().optional().or(z.literal('')),
  nextOfKinPhone: z.string().optional().or(z.literal('')),
  
  // Professional contacts
  doctorName: z.string().optional().or(z.literal('')),
  doctorPhone: z.string().optional().or(z.literal('')),
  hasProbationOfficer: z.boolean().optional(),
  probationOfficerName: z.string().optional().or(z.literal('')),
  probationOfficerPhone: z.string().optional().or(z.literal('')),
});

export const updateTenantSchema = createTenantSchema.partial();

export const createTenancySchema = z.object({
  tenantId: z.string().uuid(),
  roomId: z.string().uuid(),
  startDate: z.string().or(z.date()).transform(val => new Date(val)),
  endDate: z.string().or(z.date()).transform(val => new Date(val)).optional(),
  serviceChargeAmount: z.number().nonnegative().optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateTenancyInput = z.infer<typeof createTenancySchema>;
