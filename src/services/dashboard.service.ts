import { db } from "@/lib/db";
import { scopeFilter } from "@/lib/rbac";
import { SessionUser } from "@/types";
import { FollowUpStatus, LeadStatus, OpportunityStatus, Role } from "@prisma/client";
import { startOfDay, startOfWeek, startOfMonth, subMonths } from "date-fns";

export interface DashboardFilter {
  dateRange?: "today" | "this_week" | "this_month" | "custom";
  startDate?: string;
  endDate?: string;
}

export async function getDashboardData(filter: DashboardFilter, actor: SessionUser) {
  const scope = scopeFilter(actor);

  let dateConstraint: { gte?: Date; lte?: Date } | undefined = undefined;

  const now = new Date();
  if (filter.dateRange === "today") {
    dateConstraint = { gte: startOfDay(now) };
  } else if (filter.dateRange === "this_week") {
    dateConstraint = { gte: startOfWeek(now) };
  } else if (filter.dateRange === "this_month") {
    dateConstraint = { gte: startOfMonth(now) };
  } else if (filter.startDate || filter.endDate) {
    dateConstraint = {
      ...(filter.startDate ? { gte: new Date(filter.startDate) } : {}),
      ...(filter.endDate ? { lte: new Date(filter.endDate) } : {}),
    };
  }

  const customerWhere = {
    ...scope,
    ...(dateConstraint ? { createdAt: dateConstraint } : {}),
  };

  const leadWhere = {
    ...scope,
    ...(dateConstraint ? { createdAt: dateConstraint } : {}),
  };

  const oppWhere = {
    ...scope,
    ...(dateConstraint ? { createdAt: dateConstraint } : {}),
  };

  const followUpWhere = {
    ...scope,
  };

  const today = startOfDay(now);

  const [
    totalCustomers,
    totalLeads,
    openLeads,
    totalOpportunities,
    openOpportunities,
    wonOpportunities,
    lostOpportunities,
    pendingFollowUps,
    overdueFollowUps,
    openOpportunitiesSum,
  ] = await Promise.all([
    db.customer.count({ where: customerWhere }),
    db.lead.count({ where: leadWhere }),
    db.lead.count({
      where: {
        ...leadWhere,
        status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED] },
      },
    }),
    db.opportunity.count({ where: oppWhere }),
    db.opportunity.count({
      where: { ...oppWhere, status: OpportunityStatus.OPEN },
    }),
    db.opportunity.count({
      where: { ...oppWhere, status: OpportunityStatus.WON },
    }),
    db.opportunity.count({
      where: { ...oppWhere, status: OpportunityStatus.LOST },
    }),
    db.followUp.count({
      where: { ...followUpWhere, status: FollowUpStatus.PLANNED },
    }),
    db.followUp.count({
      where: {
        ...followUpWhere,
        status: FollowUpStatus.PLANNED,
        followUpDate: { lt: today },
      },
    }),
    db.opportunity.aggregate({
      where: { ...oppWhere, status: OpportunityStatus.OPEN },
      _sum: { amount: true },
    }),
  ]);

  const leadStatusCounts = await db.lead.groupBy({
    by: ["status"],
    where: leadWhere,
    _count: { status: true },
  });

  const opportunityStageCounts = await db.opportunity.groupBy({
    by: ["stage"],
    where: oppWhere,
    _count: { stage: true },
    _sum: { amount: true },
  });

  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const recentWonOpps = await db.opportunity.findMany({
    where: {
      ...scope,
      status: OpportunityStatus.WON,
      updatedAt: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      updatedAt: true,
    },
  });

  const monthlySales: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlySales[key] = 0;
  }

  for (const opp of recentWonOpps) {
    const key = opp.updatedAt.toLocaleString("default", { month: "short", year: "2-digit" });
    if (monthlySales[key] !== undefined) {
      monthlySales[key] += Number(opp.amount);
    }
  }

  let adminStats = null;
  if (actor.role === Role.ADMIN) {
    const [totalUsers, activeUsers, auditLogsToday] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.auditLog.count({ where: { createdAt: { gte: today } } }),
    ]);
    adminStats = { totalUsers, activeUsers, auditLogsToday };
  }

  return {
    kpis: {
      totalCustomers,
      totalLeads,
      openLeads,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      totalPipelineValue: Number(openOpportunitiesSum._sum.amount || 0),
      pendingFollowUps,
      overdueFollowUps,
    },
    charts: {
      leadStatus: leadStatusCounts.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      opportunityPipeline: opportunityStageCounts.map((item) => ({
        stage: item.stage,
        count: item._count.stage,
        totalAmount: Number(item._sum.amount || 0),
      })),
      monthlySales: Object.entries(monthlySales).map(([month, amount]) => ({
        month,
        amount,
      })),
    },
    adminStats,
  };
}
