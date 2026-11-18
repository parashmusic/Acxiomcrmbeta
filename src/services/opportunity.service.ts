import { db } from "@/lib/db";
import { can, scopeFilter } from "@/lib/rbac";
import { ForbiddenError, NotFoundError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import { toOpportunityDto, OpportunityDto } from "@/dto/opportunity.dto";
import {
  CreateOpportunityInput,
  UpdateOpportunityInput,
  OpportunityQueryInput,
} from "@/schemas/opportunity.schema";
import { SessionUser, PaginatedResult } from "@/types";
import { OpportunityStage, OpportunityStatus, Prisma } from "@prisma/client";

export async function createOpportunity(
  input: CreateOpportunityInput,
  actor: SessionUser
): Promise<OpportunityDto> {
  if (!can(actor.role, "create", "opportunities")) {
    throw new ForbiddenError();
  }

  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
  });

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  let status: OpportunityStatus = input.status || OpportunityStatus.OPEN;
  if (input.stage === OpportunityStage.WON) {
    status = OpportunityStatus.WON;
  } else if (input.stage === OpportunityStage.LOST) {
    status = OpportunityStatus.LOST;
  }

  const opportunity = await db.opportunity.create({
    data: {
      opportunityName: input.opportunityName,
      customerId: input.customerId,
      leadId: input.leadId || null,
      amount: input.amount,
      stage: input.stage,
      probability: input.probability,
      expectedCloseDate: input.expectedCloseDate,
      status,
      source: input.source || null,
      notes: input.notes || null,
      assignedToId: input.assignedToId || (actor.role === "SALES_EXECUTIVE" ? actor.id : null),
    },
    include: {
      customer: { select: { id: true, customerName: true, customerCode: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_OPPORTUNITY",
    module: "OPPORTUNITIES",
    entityName: "Opportunity",
    recordId: opportunity.id,
    newValue: {
      opportunityName: opportunity.opportunityName,
      amount: Number(opportunity.amount),
      stage: opportunity.stage,
      status: opportunity.status,
    },
  });

  return toOpportunityDto(opportunity);
}

export async function listOpportunities(
  query: OpportunityQueryInput,
  actor: SessionUser
): Promise<PaginatedResult<OpportunityDto>> {
  if (!can(actor.role, "read", "opportunities")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const scope = scopeFilter(actor);
  const where: Prisma.OpportunityWhereInput = {
    ...scope,
  };

  if (query.stage) {
    where.stage = query.stage;
  }
  if (query.status) {
    where.status = query.status;
  }
  if (query.customerId) {
    where.customerId = query.customerId;
  }
  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { opportunityName: { contains: s, mode: "insensitive" } },
      { customer: { customerName: { contains: s, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    db.opportunity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, customerName: true, customerCode: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    db.opportunity.count({ where }),
  ]);

  return {
    items: items.map(toOpportunityDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getOpportunityById(
  id: string,
  actor: SessionUser
) {
  if (!can(actor.role, "read", "opportunities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const opp = await db.opportunity.findFirst({
    where: { id, ...scope },
    include: {
      customer: { select: { id: true, customerName: true, customerCode: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      followUps: {
        orderBy: { followUpDate: "desc" },
        take: 10,
      },
    },
  });

  if (!opp) {
    throw new NotFoundError("Opportunity not found.");
  }

  return {
    ...toOpportunityDto(opp),
    followUps: opp.followUps,
  };
}

export async function updateOpportunity(
  id: string,
  input: UpdateOpportunityInput,
  actor: SessionUser
): Promise<OpportunityDto> {
  if (!can(actor.role, "update", "opportunities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.opportunity.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Opportunity not found.");
  }

  let newStatus = input.status || existing.status;
  if (input.stage) {
    if (input.stage === OpportunityStage.WON) {
      newStatus = OpportunityStatus.WON;
    } else if (input.stage === OpportunityStage.LOST) {
      newStatus = OpportunityStatus.LOST;
    } else if (existing.status !== OpportunityStatus.OPEN && !input.status) {
      newStatus = OpportunityStatus.OPEN;
    }
  }

  const updated = await db.opportunity.update({
    where: { id },
    data: {
      ...(input.opportunityName ? { opportunityName: input.opportunityName } : {}),
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.leadId !== undefined ? { leadId: input.leadId } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.stage ? { stage: input.stage } : {}),
      ...(input.probability !== undefined ? { probability: input.probability } : {}),
      ...(input.expectedCloseDate ? { expectedCloseDate: input.expectedCloseDate } : {}),
      status: newStatus,
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
    },
    include: {
      customer: { select: { id: true, customerName: true, customerCode: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_OPPORTUNITY",
    module: "OPPORTUNITIES",
    entityName: "Opportunity",
    recordId: id,
    oldValue: {
      stage: existing.stage,
      status: existing.status,
      amount: Number(existing.amount),
    },
    newValue: {
      stage: updated.stage,
      status: updated.status,
      amount: Number(updated.amount),
    },
  });

  return toOpportunityDto(updated);
}

export async function deleteOpportunity(id: string, actor: SessionUser): Promise<void> {
  if (!can(actor.role, "delete", "opportunities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.opportunity.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Opportunity not found.");
  }

  await db.opportunity.delete({
    where: { id },
  });

  await logAudit({
    userId: actor.id,
    action: "DELETE_OPPORTUNITY",
    module: "OPPORTUNITIES",
    entityName: "Opportunity",
    recordId: id,
    oldValue: {
      opportunityName: existing.opportunityName,
      amount: Number(existing.amount),
    },
  });
}

export async function getPipelineByStage(actor: SessionUser) {
  if (!can(actor.role, "read", "opportunities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const opportunities = await db.opportunity.findMany({
    where: {
      ...scope,
    },
    include: {
      customer: { select: { id: true, customerName: true, customerCode: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stages: Record<OpportunityStage, OpportunityDto[]> = {
    QUALIFICATION: [],
    PROPOSAL: [],
    NEGOTIATION: [],
    WON: [],
    LOST: [],
  };

  for (const opp of opportunities) {
    stages[opp.stage].push(toOpportunityDto(opp));
  }

  return stages;
}
