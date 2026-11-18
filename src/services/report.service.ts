import { db } from "@/lib/db";
import { scopeFilter, can } from "@/lib/rbac";
import { ForbiddenError } from "@/lib/api-error";
import { SessionUser } from "@/types";
import { LeadStatus, OpportunityStatus } from "@prisma/client";

export async function getCustomerReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const customers = await db.customer.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { name: true, email: true } },
    },
  });

  return customers.map((c) => ({
    CustomerCode: c.customerCode,
    CustomerName: c.customerName,
    Email: c.email,
    Phone: c.phone,
    Company: c.companyName || "-",
    Status: c.status,
    AssignedTo: c.assignedTo?.name || "Unassigned",
    CreatedDate: c.createdAt.toISOString().split("T")[0],
  }));
}

export async function getLeadReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const leads = await db.lead.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { name: true } },
      convertedCustomer: { select: { customerCode: true, customerName: true } },
    },
  });

  return leads.map((l) => ({
    LeadCode: l.leadCode,
    LeadName: l.leadName,
    Email: l.email || "-",
    Phone: l.phone || "-",
    Company: l.companyName || "-",
    Source: l.source,
    Status: l.status,
    Priority: l.priority,
    ExpectedValue: l.expectedValue ? Number(l.expectedValue) : 0,
    AssignedTo: l.assignedTo?.name || "Unassigned",
    ConvertedTo: l.convertedCustomer?.customerName || "-",
    CreatedDate: l.createdAt.toISOString().split("T")[0],
  }));
}

export async function getOpportunityReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const opportunities = await db.opportunity.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { customerName: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return opportunities.map((o) => ({
    OpportunityName: o.opportunityName,
    Customer: o.customer.customerName,
    Amount: Number(o.amount),
    Stage: o.stage,
    Probability: `${o.probability}%`,
    WeightedValue: Number(((Number(o.amount) * o.probability) / 100).toFixed(2)),
    Status: o.status,
    ExpectedCloseDate: o.expectedCloseDate.toISOString().split("T")[0],
    AssignedTo: o.assignedTo?.name || "Unassigned",
    CreatedDate: o.createdAt.toISOString().split("T")[0],
  }));
}

export async function getFollowUpReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const followUps = await db.followUp.findMany({
    where: scope,
    orderBy: { followUpDate: "desc" },
    include: {
      customer: { select: { customerName: true } },
      lead: { select: { leadName: true } },
      assignedTo: { select: { name: true } },
    },
  });

  return followUps.map((f) => ({
    Subject: f.subject,
    Type: f.followUpType,
    Status: f.status,
    FollowUpDate: f.followUpDate.toISOString().split("T")[0],
    RelatedTo: f.customer?.customerName || f.lead?.leadName || "-",
    AssignedTo: f.assignedTo?.name || "Unassigned",
    Remarks: f.remarks || "-",
  }));
}

export async function getPipelineReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const opportunities = await db.opportunity.findMany({
    where: {
      ...scope,
      status: OpportunityStatus.OPEN,
    },
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });

  const stageTotals: Record<string, { count: number; totalAmount: number; weightedAmount: number }> = {};
  const ownerTotals: Record<string, { count: number; totalAmount: number; weightedAmount: number }> = {};

  for (const opp of opportunities) {
    const amount = Number(opp.amount);
    const weighted = (amount * opp.probability) / 100;
    const stage = opp.stage;
    const owner = opp.assignedTo?.name || "Unassigned";

    if (!stageTotals[stage]) {
      stageTotals[stage] = { count: 0, totalAmount: 0, weightedAmount: 0 };
    }
    stageTotals[stage].count += 1;
    stageTotals[stage].totalAmount += amount;
    stageTotals[stage].weightedAmount += weighted;

    if (!ownerTotals[owner]) {
      ownerTotals[owner] = { count: 0, totalAmount: 0, weightedAmount: 0 };
    }
    ownerTotals[owner].count += 1;
    ownerTotals[owner].totalAmount += amount;
    ownerTotals[owner].weightedAmount += weighted;
  }

  return {
    byStage: Object.entries(stageTotals).map(([stage, data]) => ({
      stage,
      ...data,
      weightedAmount: Number(data.weightedAmount.toFixed(2)),
    })),
    byOwner: Object.entries(ownerTotals).map(([owner, data]) => ({
      owner,
      ...data,
      weightedAmount: Number(data.weightedAmount.toFixed(2)),
    })),
  };
}

export async function getConversionReport(actor: SessionUser) {
  if (!can(actor.role, "read", "reports")) throw new ForbiddenError();
  const scope = scopeFilter(actor);

  const [totalLeads, convertedLeads, lostLeads, wonOpps, lostOpps, openOpps] = await Promise.all([
    db.lead.count({ where: scope }),
    db.lead.count({ where: { ...scope, status: LeadStatus.CONVERTED } }),
    db.lead.count({ where: { ...scope, status: LeadStatus.LOST } }),
    db.opportunity.count({ where: { ...scope, status: OpportunityStatus.WON } }),
    db.opportunity.count({ where: { ...scope, status: OpportunityStatus.LOST } }),
    db.opportunity.count({ where: { ...scope, status: OpportunityStatus.OPEN } }),
  ]);

  const leadConversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";
  const totalClosedOpps = wonOpps + lostOpps;
  const oppWinRate = totalClosedOpps > 0 ? ((wonOpps / totalClosedOpps) * 100).toFixed(1) : "0";

  return {
    leads: {
      total: totalLeads,
      converted: convertedLeads,
      lost: lostLeads,
      conversionRate: `${leadConversionRate}%`,
    },
    opportunities: {
      open: openOpps,
      won: wonOpps,
      lost: lostOpps,
      winRate: `${oppWinRate}%`,
    },
  };
}
