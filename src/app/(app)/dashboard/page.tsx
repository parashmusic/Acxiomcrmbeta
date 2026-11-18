import { requireAuthUser } from "@/lib/auth/session";
import { getDashboardData } from "@/services/dashboard.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusChart } from "@/components/charts/lead-status-chart";
import { PipelineChart } from "@/components/charts/pipeline-chart";
import { MonthlySalesChart } from "@/components/charts/monthly-sales-chart";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  TrendingUp,
  CalendarCheck,
  IndianRupee,
  AlertCircle,
  Award,
  XCircle,
  Shield,
} from "lucide-react";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{
    dateRange?: "today" | "this_week" | "this_month" | "custom";
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const data = await getDashboardData(
    {
      dateRange: params.dateRange,
      startDate: params.startDate,
      endDate: params.endDate,
    },
    user
  );

  const { kpis, charts, adminStats } = data;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-semibold text-foreground">{user.name || user.email}</span>. Here is your sales lifecycle overview.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link
            href="/dashboard"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              !params.dateRange ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
          >
            All Time
          </Link>
          <Link
            href="/dashboard?dateRange=today"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              params.dateRange === "today" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
          >
            Today
          </Link>
          <Link
            href="/dashboard?dateRange=this_week"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              params.dateRange === "this_week" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
          >
            This Week
          </Link>
          <Link
            href="/dashboard?dateRange=this_month"
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              params.dateRange === "this_month" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
          >
            This Month
          </Link>
        </div>
      </div>

      {adminStats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {adminStats.activeUsers} active accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Events Today</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminStats.auditLogsToday}</div>
              <p className="text-xs text-muted-foreground">System audit activity</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Role Scope</CardTitle>
              <Badge variant="destructive" className="uppercase text-[10px]">
                {user.role}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Unrestricted</div>
              <p className="text-xs text-muted-foreground">Full system access</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active client accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis.openLeads}
              </span>{" "}
              open leads in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{kpis.totalPipelineValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpis.openOpportunities} active deals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Follow-Ups</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.pendingFollowUps}</div>
            <p className="text-xs text-muted-foreground">
              {kpis.overdueFollowUps > 0 ? (
                <span className="text-destructive font-medium flex items-center gap-1 mt-0.5">
                  <AlertCircle className="h-3 w-3 inline" /> {kpis.overdueFollowUps} overdue
                </span>
              ) : (
                <span className="text-emerald-600">All on schedule</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">All tracked deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Opportunities</CardTitle>
            <Award className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {kpis.wonOpportunities}
            </div>
            <p className="text-xs text-muted-foreground">Deals successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lost Opportunities</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpis.lostOpportunities}
            </div>
            <p className="text-xs text-muted-foreground">Closed as lost</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>Breakdown of leads by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadStatusChart data={charts.leadStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunity Pipeline by Stage</CardTitle>
            <CardDescription>Deal volume and stage aggregation</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart data={charts.opportunityPipeline} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Closed Sales</CardTitle>
          <CardDescription>Won deal value over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlySalesChart data={charts.monthlySales} />
        </CardContent>
      </Card>
    </div>
  );
}
