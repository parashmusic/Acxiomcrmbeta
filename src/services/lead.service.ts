import { db } from "@/lib/db";
import { can, scopeFilter } from "@/lib/rbac";
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import { toLeadDto, LeadDto } from "@/dto/lead.dto";
import {
  CreateLeadInput,
  UpdateLeadInput,
  LeadQueryInput,
  ConvertLeadInput,
  isValidLeadTransition,
} from "@/schemas/lead.schema";
import { SessionUser, PaginatedResult } from "@/types";
import { LeadStatus, CustomerStatus, OpportunityStatus, OpportunityStage, Prisma } from "@prisma/client";

async function generateLeadCode(): Promise<string> {
  const count = await db.lead.count();
  return `LED-${String(count + 1).padStart(4, "0")}`;
}

async function generateCustomerCode(): Promise<string> {
  const count = await db.customer.count();
  return `CUS-${String(count + 1).padStart(4, "0")}`;
}

export async function createLead(input: CreateLeadInput, actor: SessionUser): Promise<LeadDto> {
  if (!can(actor.role, "create", "leads")) {
    throw new ForbiddenError();
  }

  let code = await generateLeadCode();
  let exists = await db.lead.findUnique({ where: { leadCode: code } });
  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000);
    code = `LED-${random}`;
    exists = await db.lead.findUnique({ where: { leadCode: code } });
  }

  const lead = await db.lead.create({
    data: {
      leadCode: code,
      leadName: input.leadName,
      email: input.email || null,
      phone: input.phone || null,
      companyName: input.companyName || null,
      source: input.source,
      status: input.status,
      priority: input.priority,
      expectedValue: input.expectedValue ?? null,
      notes: input.notes || null,
      assignedToId: input.assignedToId || (actor.role === "SALES_EXECUTIVE" ? actor.id : null),
      createdById: actor.id,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_LEAD",
    module: "LEADS",
    entityName: "Lead",
    recordId: lead.id,
    newValue: {
      leadCode: lead.leadCode,
      leadName: lead.leadName,
      status: lead.status,
    },
  });

  return toLeadDto(lead);
}

export async function listLeads(query: LeadQueryInput, actor: SessionUser): Promise<PaginatedResult<LeadDto>> {
  if (!can(actor.role, "read", "leads")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const scope = scopeFilter(actor);
  const where: Prisma.LeadWhereInput = {
    ...scope,
  };

  if (query.status) {
    where.status = query.status;
  }
  if (query.priority) {
    where.priority = query.priority;
  }
  if (query.source) {
    where.source = query.source;
  }
  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }
  if (query.search) {
    const s = query.search.trim();
    where.OR = [
      { leadName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
      { companyName: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.lead.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    }),
    db.lead.count({ where }),
  ]);

  return {
    items: items.map(toLeadDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLeadById(
  id: string,
  actor: SessionUser
) {
  if (!can(actor.role, "read", "leads")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const lead = await db.lead.findFirst({
    where: { id, ...scope },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
      convertedCustomer: true,
      convertedOpportunity: true,
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

  if (!lead) {
    throw new NotFoundError("Lead not found.");
  }

  return {
    ...toLeadDto(lead),
    convertedCustomer: lead.convertedCustomer,
    convertedOpportunity: lead.convertedOpportunity,
    followUps: lead.followUps,
    activities: lead.activities,
  };
}

export async function updateLead(id: string, input: UpdateLeadInput, actor: SessionUser): Promise<LeadDto> {
  if (!can(actor.role, "update", "leads")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.lead.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Lead not found.");
  }

  if (input.status && input.status !== existing.status) {
    if (!isValidLeadTransition(existing.status, input.status)) {
      throw new ValidationError(
        [{ field: "status", message: "Invalid status transition." }],
        "Invalid status transition."
      );
    }
  }

  const updated = await db.lead.update({
    where: { id },
    data: {
      ...(input.leadName ? { leadName: input.leadName } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.companyName !== undefined ? { companyName: input.companyName || null } : {}),
      ...(input.source ? { source: input.source } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.expectedValue !== undefined ? { expectedValue: input.expectedValue } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_LEAD",
    module: "LEADS",
    entityName: "Lead",
    recordId: id,
    oldValue: { status: existing.status, priority: existing.priority },
    newValue: { status: updated.status, priority: updated.priority },
  });

  return toLeadDto(updated);
}

export async function convertLead(
  leadId: string,
  input: ConvertLeadInput,
  actor: SessionUser
): Promise<{ customerId: string; opportunityId?: string }> {
  if (!can(actor.role, "convert", "leads")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const lead = await db.lead.findFirst({
    where: { id: leadId, ...scope },
  });

  if (!lead) {
    throw new NotFoundError("Lead not found.");
  }

  if (lead.status !== LeadStatus.QUALIFIED) {
    throw new ValidationError(
      [{ field: "status", message: "Only QUALIFIED leads can be converted." }],
      "Lead must be QUALIFIED to convert."
    );
  }

  if (!lead.email && !lead.phone) {
    throw new ValidationError(
      [{ field: "lead", message: "Lead must have at least an email or phone to convert to a customer." }],
      "Missing contact details."
    );
  }

  const emailToUse = lead.email || `lead-${lead.id}@placeholder.acxiom`;
  const phoneToUse = lead.phone || `9${Math.floor(100000000 + Math.random() * 900000000)}`;

  const existingCustomer = await db.customer.findFirst({
    where: {
      OR: [{ email: emailToUse }, { phone: phoneToUse }],
    },
  });

  if (existingCustomer) {
    throw new ConflictError("Customer already exists with this email or phone.");
  }

  return await db.$transaction(async (tx) => {
    let customerCode = await generateCustomerCode();
    let codeExists = await tx.customer.findUnique({ where: { customerCode } });
    while (codeExists) {
      customerCode = `CUS-${Math.floor(1000 + Math.random() * 9000)}`;
      codeExists = await tx.customer.findUnique({ where: { customerCode } });
    }

    const customer = await tx.customer.create({
      data: {
        customerCode,
        customerName: lead.leadName,
        email: emailToUse,
        phone: phoneToUse,
        companyName: lead.companyName ?? null,
        status: CustomerStatus.ACTIVE,
        notes: lead.notes ? `Converted from Lead ${lead.leadCode}. Notes: ${lead.notes}` : `Converted from Lead ${lead.leadCode}`,
        assignedToId: lead.assignedToId || actor.id,
        createdById: actor.id,
      },
    });

    let oppId: string | undefined = undefined;

    if (input.createOpportunity && input.opportunityName && input.amount && input.expectedCloseDate) {
      const opportunity = await tx.opportunity.create({
        data: {
          opportunityName: input.opportunityName,
          customerId: customer.id,
          leadId: lead.id,
          amount: input.amount,
          stage: OpportunityStage.QUALIFICATION,
          probability: 25,
          expectedCloseDate: input.expectedCloseDate,
          status: OpportunityStatus.OPEN,
          source: lead.source,
          assignedToId: lead.assignedToId || actor.id,
        },
      });
      oppId = opportunity.id;
    }

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: LeadStatus.CONVERTED,
        convertedCustomerId: customer.id,
        ...(oppId ? { convertedOpportunityId: oppId } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "CONVERT_LEAD",
        module: "LEADS",
        entityName: "Lead",
        recordId: lead.id,
        oldValue: { status: lead.status },
        newValue: {
          status: LeadStatus.CONVERTED,
          convertedCustomerId: customer.id,
          convertedOpportunityId: oppId,
        },
        result: "SUCCESS",
      },
    });

    return {
      customerId: customer.id,
      opportunityId: oppId,
    };
  });
}

export async function deleteLead(id: string, actor: SessionUser): Promise<void> {
  if (!can(actor.role, "delete", "leads")) {
    throw new ForbiddenError();
  }

  const scope = scopeFilter(actor);
  const existing = await db.lead.findFirst({
    where: { id, ...scope },
  });

  if (!existing) {
    throw new NotFoundError("Lead not found.");
  }

  await db.lead.delete({
    where: { id },
  });

  await logAudit({
    userId: actor.id,
    action: "DELETE_LEAD",
    module: "LEADS",
    entityName: "Lead",
    recordId: id,
    oldValue: { leadCode: existing.leadCode, leadName: existing.leadName },
  });
}
