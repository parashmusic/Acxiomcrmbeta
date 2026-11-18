import { z } from "zod";
import { ActivityStatus, ActivityType } from "@prisma/client";

export const createActivitySchema = z.object({
  activityType: z.nativeEnum(ActivityType),
  subject: z
    .string()
    .min(2, "Subject must be at least 2 characters.")
    .max(200, "Subject cannot exceed 200 characters."),
  description: z.string().max(1000, "Description cannot exceed 1000 characters.").optional().nullable(),
  activityDate: z.coerce.date(),
  customerId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  status: z.nativeEnum(ActivityStatus).default(ActivityStatus.PLANNED),
});

export const updateActivitySchema = createActivitySchema.partial();

export const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  activityType: z.nativeEnum(ActivityType).optional(),
  status: z.nativeEnum(ActivityStatus).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  date: z.string().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;
