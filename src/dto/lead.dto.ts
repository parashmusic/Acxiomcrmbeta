import { Lead, LeadPriority, LeadSource, LeadStatus } from "@prisma/client";

export interface LeadDto {
  id: string;
  leadCode: string;
  leadName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  expectedValue: number | null;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdById: string | null;
  createdBy?: {
    id: string;
    name: string | null;
  } | null;
  convertedCustomerId: string | null;
  convertedOpportunityId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toLeadDto(
  lead: Lead & {
    assignedTo?: { id: string; name: string | null; email: string } | null;
    createdBy?: { id: string; name: string | null } | null;
  }
): LeadDto {
  return {
    id: lead.id,
    leadCode: lead.leadCode,
    leadName: lead.leadName,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    expectedValue: lead.expectedValue ? Number(lead.expectedValue) : null,
    notes: lead.notes,
    assignedToId: lead.assignedToId,
    assignedTo: lead.assignedTo ?? null,
    createdById: lead.createdById,
    createdBy: lead.createdBy ?? null,
    convertedCustomerId: lead.convertedCustomerId,
    convertedOpportunityId: lead.convertedOpportunityId,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}
