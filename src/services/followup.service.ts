import { db } from "@/lib/db";
import { can, scopeFilter } from "@/lib/rbac";
import { ForbiddenError, NotFoundError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import { toFollowUpDto, FollowUpDto } from "@/dto/followup.dto";
import {
  CreateFollowUpInput,
  UpdateFollowUpInput,
  FollowUpQueryInput,
} from "@/schemas/followup.schema";
import { SessionUser, PaginatedResult } from "@/types";
import { FollowUpStatus, Prisma } from "@prisma/client";
import { startOfDay } from "date-fns";

export async function createFollowUp(
  input: CreateFollowUpInput,
  actor: SessionUser
): Promise<FollowUpDto> {
  if (!can(actor.role, "create", "follow-ups")) {
    throw new ForbiddenError();
  }

  const followUp = await db.followUp.create({
    data: {
      customerId: input.customerId || null,
      leadId: input.leadId || null,
      opportunityId: input.opportunityId || null,
      followUpDate: input.followUpDate,
      subject: input.subject,
      followUpType: input.followUpType,
      remarks: input.remarks || null,
      status: input.status,
      assignedToId: input.assignedToId || (actor.role === "SALES_EXECUTIVE" ? actor.id : null),
    },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      opportunity: { select: { id: true, opportunityName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_FOLLOW_UP",
    module: "FOLLOW_UPS",
    entityName: "FollowUp",
    recordId: followUp.id,
    newValue: {
      subject: followUp.subject,
      followUpDate: followUp.followUpDate,
      status: followUp.status,
    },
  });

  return toFollowUpDto(followUp);
}

export async function listFollowUps(
  query: FollowUpQueryInput,
  actor: SessionUser
): Promise<PaginatedResult<FollowUpDto>> {
  if (!can(actor.role, "read", "follow-ups")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const scope = scopeFilter(actor);
  const where: Prisma.FollowUpWhereInput = {
    ...scope,
  };

  if (query.status) {
    where.status = query.status;
  }
  if (query.followUpType) {
    where.followUpType = query.followUpType;
  }
  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }
  if (query.customerId) {
    where.customerId = query.customerId;
  }
  if (query.leadId) {
    where.leadId = query.leadId;
  }
  if (query.opportunityId) {
    where.opportunityId = query.opportunityId;
  }
  if (query.date) {
    const d = new Date(query.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.followUpDate = {
      gte: d,
      lt: nextDay,
    };
  }
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { subject: { contains: s, mode: "insensitive" } },
      { remarks: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.followUp.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { followUpDate: "asc" },
      include: {
        customer: { select: { id: true, customerName: true } },
        lead: { select: { id: true, leadName: true } },
        opportunity: { select: { id: true, opportunityName: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    db.followUp.count({ where }),
  ]);

  return {
    items: items.map(toFollowUpDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getFollowUpById(id: string, actor: SessionUser): Promise<FollowUpDto> {
  if (!can(actor.role, "read", "follow-ups")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const followUp = await db.followUp.findFirst({
    where: { id, ...scope },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      opportunity: { select: { id: true, opportunityName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!followUp) {
    throw new NotFoundError("Follow-up not found.");
  }

  return toFollowUpDto(followUp);
}

export async function updateFollowUp(
  id: string,
  input: UpdateFollowUpInput,
  actor: SessionUser
): Promise<FollowUpDto> {
  if (!can(actor.role, "update", "follow-ups")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.followUp.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Follow-up not found.");
  }

  const updated = await db.followUp.update({
    where: { id },
    data: {
      ...(input.followUpDate ? { followUpDate: input.followUpDate } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
      ...(input.followUpType ? { followUpType: input.followUpType } : {}),
      ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
    },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      opportunity: { select: { id: true, opportunityName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_FOLLOW_UP",
    module: "FOLLOW_UPS",
    entityName: "FollowUp",
    recordId: id,
    oldValue: {
      status: existing.status,
      followUpDate: existing.followUpDate,
    },
    newValue: {
      status: updated.status,
      followUpDate: updated.followUpDate,
    },
  });

  return toFollowUpDto(updated);
}

export async function deleteFollowUp(id: string, actor: SessionUser): Promise<void> {
  if (!can(actor.role, "delete", "follow-ups")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.followUp.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Follow-up not found.");
  }

  await db.followUp.delete({
    where: { id },
  });

  await logAudit({
    userId: actor.id,
    action: "DELETE_FOLLOW_UP",
    module: "FOLLOW_UPS",
    entityName: "FollowUp",
    recordId: id,
    oldValue: { subject: existing.subject },
  });
}

export async function completeFollowUp(
  id: string,
  remarks: string | undefined,
  actor: SessionUser
): Promise<FollowUpDto> {
  return updateFollowUp(
    id,
    {
      status: FollowUpStatus.COMPLETED,
      ...(remarks !== undefined ? { remarks } : {}),
    },
    actor
  );
}

export async function markOverdueFollowUpsAsMissed(): Promise<number> {
  const today = startOfDay(new Date());

  const result = await db.followUp.updateMany({
    where: {
      status: FollowUpStatus.PLANNED,
      followUpDate: {
        lt: today,
      },
    },
    data: {
      status: FollowUpStatus.MISSED,
    },
  });

  await logAudit({
    action: "CRON_MARK_MISSED_FOLLOW_UPS",
    module: "FOLLOW_UPS",
    entityName: "FollowUp",
    result: `Marked ${result.count} follow-ups as MISSED`,
    newValue: { updatedCount: result.count },
  });

  return result.count;
}
