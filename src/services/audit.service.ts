import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  module: string;
  entityName: string;
  recordId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  result?: string;
  ipAddress?: string | null;
}

function sanitizeAuditValue(value?: Record<string, unknown> | null): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  const sanitized = { ...value };
  const sensitiveKeys = ["password", "passwordHash", "token", "secret", "confirmPassword"];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      delete sanitized[key];
    }
  }
  return sanitized as Prisma.InputJsonValue;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        entityName: params.entityName,
        recordId: params.recordId ?? null,
        oldValue: sanitizeAuditValue(params.oldValue),
        newValue: sanitizeAuditValue(params.newValue),
        result: params.result ?? "SUCCESS",
        ipAddress: params.ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error);
    return null;
  }
}

export interface AuditQueryFilter {
  page?: number;
  pageSize?: number;
  userId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(filter: AuditQueryFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = {};

  if (filter.userId) {
    where.userId = filter.userId;
  }
  if (filter.module) {
    where.module = filter.module;
  }
  if (filter.action) {
    where.action = filter.action;
  }
  if (filter.startDate || filter.endDate) {
    where.createdAt = {};
    if (filter.startDate) {
      where.createdAt.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      where.createdAt.lte = new Date(filter.endDate);
    }
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
