import { z } from 'zod';
import { SubscriptionTier } from '@prisma/client';

// Schema for creating a new organization with initial admin user
export const createOrganizationSchema = z.object({
  // Organization details
  organization: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    subdomain: z.string()
      .min(2, 'Subdomain must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
    contactEmail: z.string().email('Invalid contact email'),
    contactPhone: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    subscriptionTier: z.nativeEnum(SubscriptionTier).default(SubscriptionTier.BASIC),
    billingContact: z.string().optional(),
    billingEmail: z.string().email('Invalid billing email').optional().or(z.literal('')),
    billingAddress: z.string().optional(),
    paymentMethod: z.string().optional(),
  }),
  // Initial admin user details
  initialAdmin: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Schema for updating organization details
export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').optional(),
  subdomain: z.string()
    .min(2, 'Subdomain must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  contactEmail: z.string().email('Invalid contact email').optional(),
  contactPhone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  postcode: z.string().optional().or(z.literal('')),
  subscriptionTier: z.nativeEnum(SubscriptionTier).optional(),
  billingContact: z.string().optional().or(z.literal('')),
  billingEmail: z.string().email('Invalid billing email').optional().or(z.literal('')),
  billingAddress: z.string().optional().or(z.literal('')),
  paymentMethod: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
