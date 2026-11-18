import { z } from "zod";
import { LeadPriority, LeadSource, LeadStatus } from "@prisma/client";
import { indianPhoneRegex } from "./customer.schema";

export const leadStatusTransitions: Record<LeadStatus, LeadStatus[]> = {
  NEW: [LeadStatus.CONTACTED, LeadStatus.LOST],
  CONTACTED: [LeadStatus.QUALIFIED, LeadStatus.UNQUALIFIED, LeadStatus.LOST],
  QUALIFIED: [LeadStatus.CONVERTED, LeadStatus.LOST],
  UNQUALIFIED: [LeadStatus.CONTACTED, LeadStatus.LOST],
  CONVERTED: [],
  LOST: [],
};

export function isValidLeadTransition(current: LeadStatus, next: LeadStatus): boolean {
  if (current === next) return true;
  const allowed = leadStatusTransitions[current];
  return allowed ? allowed.includes(next) : false;
}

export const createLeadSchema = z.object({
  leadName: z
    .string()
    .min(2, "Lead name must be at least 2 characters.")
    .max(100, "Lead name cannot exceed 100 characters."),
  email: z.string().email("Enter a valid email address.").optional().nullable().or(z.literal("")),
  phone: z
    .string()
    .regex(indianPhoneRegex, "Enter a valid phone number.")
    .optional()
    .nullable()
    .or(z.literal("")),
  companyName: z.string().max(100, "Company name cannot exceed 100 characters.").optional().nullable(),
  source: z.nativeEnum(LeadSource).default(LeadSource.OTHER),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  priority: z.nativeEnum(LeadPriority).default(LeadPriority.MEDIUM),
  expectedValue: z.coerce
    .number()
    .min(0, "Expected value must be greater than or equal to 0.")
    .max(100000000, "Expected value cannot exceed 100,000,000.")
    .optional()
    .nullable(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").optional().nullable(),
  assignedToId: z.string().optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  createOpportunity: z.boolean().default(false),
  opportunityName: z.string().min(2, "Opportunity name must be at least 2 characters.").optional(),
  amount: z.coerce.number().positive("Opportunity Amount must be greater than 0.").optional(),
  expectedCloseDate: z.coerce.date().optional(),
  stage: z.string().optional(),
});

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  priority: z.nativeEnum(LeadPriority).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  assignedToId: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
