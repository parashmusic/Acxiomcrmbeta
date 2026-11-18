import { FollowUp, FollowUpStatus, FollowUpType } from "@prisma/client";

export interface FollowUpDto {
  id: string;
  customerId: string | null;
  customer?: { id: string; customerName: string } | null;
  leadId: string | null;
  lead?: { id: string; leadName: string } | null;
  opportunityId: string | null;
  opportunity?: { id: string; opportunityName: string } | null;
  followUpDate: Date;
  subject: string;
  followUpType: FollowUpType;
  remarks: string | null;
  status: FollowUpStatus;
  assignedToId: string | null;
  assignedTo?: { id: string; name: string | null; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toFollowUpDto(
  f: FollowUp & {
    customer?: { id: string; customerName: string } | null;
    lead?: { id: string; leadName: string } | null;
    opportunity?: { id: string; opportunityName: string } | null;
    assignedTo?: { id: string; name: string | null; email: string } | null;
  }
): FollowUpDto {
  return {
    id: f.id,
    customerId: f.customerId,
    customer: f.customer ?? null,
    leadId: f.leadId,
    lead: f.lead ?? null,
    opportunityId: f.opportunityId,
    opportunity: f.opportunity ?? null,
    followUpDate: f.followUpDate,
    subject: f.subject,
    followUpType: f.followUpType,
    remarks: f.remarks,
    status: f.status,
    assignedToId: f.assignedToId,
    assignedTo: f.assignedTo ?? null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
}
