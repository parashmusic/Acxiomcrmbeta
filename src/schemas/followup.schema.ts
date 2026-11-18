import { z } from "zod";
import { FollowUpStatus, FollowUpType } from "@prisma/client";
import { startOfDay } from "date-fns";

export const createFollowUpSchema = z
  .object({
    customerId: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    opportunityId: z.string().optional().nullable(),
    followUpDate: z.coerce.date(),
    subject: z
      .string()
      .min(2, "Subject must be at least 2 characters.")
      .max(200, "Subject cannot exceed 200 characters."),
    followUpType: z.nativeEnum(FollowUpType),
    remarks: z.string().max(1000, "Remarks cannot exceed 1000 characters.").optional().nullable(),
    status: z.nativeEnum(FollowUpStatus).default(FollowUpStatus.PLANNED),
    assignedToId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.customerId && !data.leadId && !data.opportunityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Follow-up must be linked to a customer, lead, or opportunity.",
        path: ["customerId"],
      });
    }

    if (data.status === FollowUpStatus.PLANNED) {
      const today = startOfDay(new Date());
      if (startOfDay(new Date(data.followUpDate)) < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Follow-up date cannot be earlier than today.",
          path: ["followUpDate"],
        });
      }
    }
  });

export const updateFollowUpSchema = z
  .object({
    customerId: z.string().optional().nullable(),
    leadId: z.string().optional().nullable(),
    opportunityId: z.string().optional().nullable(),
    followUpDate: z.coerce.date().optional(),
    subject: z.string().min(2, "Subject must be at least 2 characters.").max(200).optional(),
    followUpType: z.nativeEnum(FollowUpType).optional(),
    remarks: z.string().max(1000).optional().nullable(),
    status: z.nativeEnum(FollowUpStatus).optional(),
    assignedToId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.followUpDate && data.status === FollowUpStatus.PLANNED) {
      const today = startOfDay(new Date());
      if (startOfDay(new Date(data.followUpDate)) < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Follow-up date cannot be earlier than today.",
          path: ["followUpDate"],
        });
      }
    }
  });

export const followUpQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(FollowUpStatus).optional(),
  followUpType: z.nativeEnum(FollowUpType).optional(),
  assignedToId: z.string().optional(),
  customerId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
  date: z.string().optional(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type FollowUpQueryInput = z.infer<typeof followUpQuerySchema>;
