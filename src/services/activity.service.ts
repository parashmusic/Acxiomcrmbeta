import { db } from "@/lib/db";
import { can, scopeFilter } from "@/lib/rbac";
import { ForbiddenError, NotFoundError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import {
  CreateActivityInput,
  UpdateActivityInput,
  ActivityQueryInput,
} from "@/schemas/activity.schema";
import { SessionUser } from "@/types";
import { Prisma } from "@prisma/client";

export async function createActivity(input: CreateActivityInput, actor: SessionUser) {
  if (!can(actor.role, "create", "activities")) {
    throw new ForbiddenError();
  }

  const activity = await db.activity.create({
    data: {
      activityType: input.activityType,
      subject: input.subject,
      description: input.description || null,
      activityDate: input.activityDate,
      customerId: input.customerId || null,
      leadId: input.leadId || null,
      assignedToId: input.assignedToId || (actor.role === "SALES_EXECUTIVE" ? actor.id : null),
      status: input.status,
    },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_ACTIVITY",
    module: "ACTIVITIES",
    entityName: "Activity",
    recordId: activity.id,
    newValue: {
      subject: activity.subject,
      activityType: activity.activityType,
    },
  });

  return activity;
}

export async function listActivities(query: ActivityQueryInput, actor: SessionUser) {
  if (!can(actor.role, "read", "activities")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const scope = scopeFilter(actor);
  const where: Prisma.ActivityWhereInput = {
    ...scope,
  };

  if (query.activityType) {
    where.activityType = query.activityType;
  }
  if (query.status) {
    where.status = query.status;
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
  if (query.date) {
    const d = new Date(query.date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.activityDate = {
      gte: d,
      lt: nextDay,
    };
  }
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { subject: { contains: s, mode: "insensitive" } },
      { description: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.activity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { activityDate: "desc" },
      include: {
        customer: { select: { id: true, customerName: true } },
        lead: { select: { id: true, leadName: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    }),
    db.activity.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getActivityById(id: string, actor: SessionUser) {
  if (!can(actor.role, "read", "activities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const activity = await db.activity.findFirst({
    where: { id, ...scope },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  if (!activity) {
    throw new NotFoundError("Activity not found.");
  }

  return activity;
}

export async function updateActivity(id: string, input: UpdateActivityInput, actor: SessionUser) {
  if (!can(actor.role, "update", "activities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.activity.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Activity not found.");
  }

  const updated = await db.activity.update({
    where: { id },
    data: {
      ...(input.activityType ? { activityType: input.activityType } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.activityDate ? { activityDate: input.activityDate } : {}),
      ...(input.customerId !== undefined ? { customerId: input.customerId } : {}),
      ...(input.leadId !== undefined ? { leadId: input.leadId } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
    include: {
      customer: { select: { id: true, customerName: true } },
      lead: { select: { id: true, leadName: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_ACTIVITY",
    module: "ACTIVITIES",
    entityName: "Activity",
    recordId: id,
    oldValue: { status: existing.status },
    newValue: { status: updated.status },
  });

  return updated;
}

export async function deleteActivity(id: string, actor: SessionUser) {
  if (!can(actor.role, "delete", "activities")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.activity.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Activity not found.");
  }

  await db.activity.delete({
    where: { id },
  });

  await logAudit({
    userId: actor.id,
    action: "DELETE_ACTIVITY",
    module: "ACTIVITIES",
    entityName: "Activity",
    recordId: id,
    oldValue: { subject: existing.subject },
  });
}
