import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Room facilities constants
export const ROOM_FACILITIES = [
  'ensuite',
  'shared_bathroom',
  'accessible',
  'kitchenette',
] as const;

export type RoomFacility = typeof ROOM_FACILITIES[number];

export const ROOM_FACILITY_LABELS: Record<RoomFacility, string> = {
  ensuite: 'Ensuite',
  shared_bathroom: 'Shared Bathroom',
  accessible: 'Accessible',
  kitchenette: 'Kitchenette',
};

// Room type constants
export const ROOM_TYPES = ['single', 'double'] as const;
export type RoomType = typeof ROOM_TYPES[number];

export const ROOM_TYPE_CONFIG: Record<RoomType, { label: string; capacity: number }> = {
  single: { label: 'Single Room', capacity: 1 },
  double: { label: 'Double Room', capacity: 2 },
};
