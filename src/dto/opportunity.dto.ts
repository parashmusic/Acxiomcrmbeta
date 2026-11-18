import { Opportunity, OpportunityStage, OpportunityStatus, LeadSource } from "@prisma/client";

export interface OpportunityDto {
  id: string;
  opportunityName: string;
  customerId: string;
  customer?: {
    id: string;
    customerName: string;
    customerCode: string;
  } | null;
  leadId: string | null;
  amount: number;
  stage: OpportunityStage;
  probability: number;
  weightedValue: number;
  expectedCloseDate: Date;
  status: OpportunityStatus;
  source: LeadSource | null;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toOpportunityDto(
  opp: Opportunity & {
    customer?: { id: string; customerName: string; customerCode: string } | null;
    assignedTo?: { id: string; name: string | null; email: string } | null;
  }
): OpportunityDto {
  const amount = Number(opp.amount);
  const weightedValue = Number(((amount * opp.probability) / 100).toFixed(2));

  return {
    id: opp.id,
    opportunityName: opp.opportunityName,
    customerId: opp.customerId,
    customer: opp.customer ?? null,
    leadId: opp.leadId,
    amount,
    stage: opp.stage,
    probability: opp.probability,
    weightedValue,
    expectedCloseDate: opp.expectedCloseDate,
    status: opp.status,
    source: opp.source,
    notes: opp.notes,
    assignedToId: opp.assignedToId,
    assignedTo: opp.assignedTo ?? null,
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
  };
}
