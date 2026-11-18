import { z } from "zod";
import { OpportunityStage, OpportunityStatus, LeadSource } from "@prisma/client";
import { startOfDay } from "date-fns";

export const createOpportunitySchema = z
  .object({
    opportunityName: z
      .string()
      .min(2, "Opportunity name must be at least 2 characters.")
      .max(200, "Opportunity name cannot exceed 200 characters."),
    customerId: z.string().min(1, "Customer is required."),
    leadId: z.string().optional().nullable(),
    amount: z.coerce.number().min(0.01, "Opportunity Amount must be greater than 0."),
    stage: z.nativeEnum(OpportunityStage).default(OpportunityStage.QUALIFICATION),
    probability: z.coerce
      .number()
      .int()
      .min(0, "Probability must be between 0 and 100.")
      .max(100, "Probability must be between 0 and 100.")
      .default(0),
    expectedCloseDate: z.coerce.date(),
    status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.OPEN),
    source: z.nativeEnum(LeadSource).optional().nullable(),
    notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional().nullable(),
    assignedToId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === OpportunityStatus.OPEN) {
      if (data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Opportunity Amount must be greater than 0.",
          path: ["amount"],
        });
      }
      const today = startOfDay(new Date());
      if (startOfDay(new Date(data.expectedCloseDate)) < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected Close Date cannot be in the past.",
          path: ["expectedCloseDate"],
        });
      }
    }
  });

export const updateOpportunitySchema = z
  .object({
    opportunityName: z.string().min(2, "Opportunity name must be at least 2 characters.").max(200).optional(),
    customerId: z.string().min(1, "Customer is required.").optional(),
    leadId: z.string().optional().nullable(),
    amount: z.coerce.number().optional(),
    stage: z.nativeEnum(OpportunityStage).optional(),
    probability: z.coerce.number().int().min(0).max(100).optional(),
    expectedCloseDate: z.coerce.date().optional(),
    status: z.nativeEnum(OpportunityStatus).optional(),
    source: z.nativeEnum(LeadSource).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    assignedToId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.amount !== undefined && data.amount <= 0 && data.status !== OpportunityStatus.LOST) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opportunity Amount must be greater than 0.",
        path: ["amount"],
      });
    }
    if (data.expectedCloseDate && data.status === OpportunityStatus.OPEN) {
      const today = startOfDay(new Date());
      if (startOfDay(new Date(data.expectedCloseDate)) < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected Close Date cannot be in the past.",
          path: ["expectedCloseDate"],
        });
      }
    }
  });

export const opportunityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  stage: z.nativeEnum(OpportunityStage).optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  customerId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityQueryInput = z.infer<typeof opportunityQuerySchema>;
