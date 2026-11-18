import { db } from "@/lib/db";
import { can, scopeFilter } from "@/lib/rbac";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import { toCustomerDto, CustomerDto } from "@/dto/customer.dto";
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQueryInput,
} from "@/schemas/customer.schema";
import { SessionUser, PaginatedResult } from "@/types";
import { CustomerStatus, Prisma } from "@prisma/client";

async function generateCustomerCode(): Promise<string> {
  const count = await db.customer.count();
  return `CUS-${String(count + 1).padStart(4, "0")}`;
}

export async function createCustomer(
  input: CreateCustomerInput,
  actor: SessionUser
): Promise<CustomerDto> {
  if (!can(actor.role, "create", "customers")) {
    throw new ForbiddenError();
  }

  const existing = await db.customer.findFirst({
    where: {
      OR: [{ email: input.email }, { phone: input.phone }],
    },
  });

  if (existing) {
    throw new ConflictError("Customer already exists.");
  }

  let code = await generateCustomerCode();
  let codeExists = await db.customer.findUnique({ where: { customerCode: code } });
  while (codeExists) {
    const random = Math.floor(1000 + Math.random() * 9000);
    code = `CUS-${random}`;
    codeExists = await db.customer.findUnique({ where: { customerCode: code } });
  }

  const customer = await db.customer.create({
    data: {
      customerCode: code,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      companyName: input.companyName ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      notes: input.notes ?? null,
      assignedToId: input.assignedToId || (actor.role === "SALES_EXECUTIVE" ? actor.id : null),
      createdById: actor.id,
      status: CustomerStatus.ACTIVE,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_CUSTOMER",
    module: "CUSTOMERS",
    entityName: "Customer",
    recordId: customer.id,
    newValue: {
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      email: customer.email,
      phone: customer.phone,
    },
  });

  return toCustomerDto(customer);
}

export async function listCustomers(
  query: CustomerQueryInput,
  actor: SessionUser
): Promise<PaginatedResult<CustomerDto>> {
  if (!can(actor.role, "read", "customers")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const scope = scopeFilter(actor);
  const where: Prisma.CustomerWhereInput = {
    ...scope,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }

  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { customerName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
      { companyName: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    db.customer.count({ where }),
  ]);

  return {
    items: items.map(toCustomerDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomerById(
  id: string,
  actor: SessionUser
) {
  if (!can(actor.role, "read", "customers")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const customer = await db.customer.findFirst({
    where: { id, ...scope },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      leads: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      opportunities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      followUps: {
        orderBy: { followUpDate: "desc" },
        take: 10,
      },
      activities: {
        orderBy: { activityDate: "desc" },
        take: 10,
      },
    },
  });

  if (!customer) {
    throw new NotFoundError("Customer not found.");
  }

  return {
    ...toCustomerDto(customer),
    leads: customer.leads,
    opportunities: customer.opportunities,
    followUps: customer.followUps,
    activities: customer.activities,
  };
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
  actor: SessionUser
): Promise<CustomerDto> {
  if (!can(actor.role, "update", "customers")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.customer.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Customer not found.");
  }

  if (input.email || input.phone) {
    const conflict = await db.customer.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(input.email ? [{ email: input.email }] : []),
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
    });

    if (conflict) {
      throw new ConflictError("Customer already exists.");
    }
  }

  const updated = await db.customer.update({
    where: { id },
    data: {
      ...(input.customerName ? { customerName: input.customerName } : {}),
      ...(input.email ? { email: input.email } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_CUSTOMER",
    module: "CUSTOMERS",
    entityName: "Customer",
    recordId: id,
    oldValue: {
      customerName: existing.customerName,
      email: existing.email,
      phone: existing.phone,
      status: existing.status,
    },
    newValue: {
      customerName: updated.customerName,
      email: updated.email,
      phone: updated.phone,
      status: updated.status,
    },
  });

  return toCustomerDto(updated);
}

export async function deactivateCustomer(id: string, actor: SessionUser): Promise<void> {
  if (!can(actor.role, "delete", "customers")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.customer.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Customer not found.");
  }

  await db.customer.update({
    where: { id },
    data: { status: CustomerStatus.INACTIVE },
  });

  await logAudit({
    userId: actor.id,
    action: "DEACTIVATE_CUSTOMER",
    module: "CUSTOMERS",
    entityName: "Customer",
    recordId: id,
    oldValue: { status: existing.status },
    newValue: { status: CustomerStatus.INACTIVE },
  });
}
