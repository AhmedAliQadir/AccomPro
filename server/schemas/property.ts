import { z } from 'zod';

export const createPropertySchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  address: z.string().min(1, 'Address is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  totalUnits: z.number().int().positive('Total units must be positive'),
  description: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createRoomSchema = z.object({
  propertyId: z.string().uuid(),
  roomNumber: z.string().min(1, 'Room number is required'),
  capacity: z.number().int().positive().default(1),
  floor: z.number().int().optional(),
});

export const updateRoomSchema = createRoomSchema.partial().omit({ propertyId: true });

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
