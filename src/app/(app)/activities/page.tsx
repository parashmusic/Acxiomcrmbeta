import { requireAuthUser } from "@/lib/auth/session";
import { listActivities } from "@/services/activity.service";
import { activityQuerySchema } from "@/schemas/activity.schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data-table/pagination";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { can } from "@/lib/rbac";

interface ActivitiesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    activityType?: string;
    status?: string;
    assignedToId?: string;
    customerId?: string;
    leadId?: string;
    date?: string;
  }>;
}

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const query = activityQuerySchema.parse({
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    activityType: params.activityType || undefined,
    status: params.status || undefined,
    assignedToId: params.assignedToId || undefined,
    customerId: params.customerId || undefined,
    leadId: params.leadId || undefined,
    date: params.date || undefined,
  });

  const { items, total, page, pageSize, totalPages } = await listActivities(query, user);
  const canCreate = can(user.role, "create", "activities");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
          <p className="text-muted-foreground">Log and review sales interactions across all touchpoints.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/activities/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Log Activity
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/activities"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            !params.activityType ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          All
        </Link>
        <Link
          href="/activities?activityType=CALL"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.activityType === "CALL" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Calls
        </Link>
        <Link
          href="/activities?activityType=MEETING"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.activityType === "MEETING" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Meetings
        </Link>
        <Link
          href="/activities?activityType=EMAIL"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.activityType === "EMAIL" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Emails
        </Link>
        <Link
          href="/activities?activityType=TASK"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.activityType === "TASK" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Tasks
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No activities recorded.
                </TableCell>
              </TableRow>
            ) : (
              items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{new Date(a.activityDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.activityType}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{a.subject}</TableCell>
                  <TableCell>
                    {a.customer ? (
                      <Link href={`/customers/${a.customerId}`} className="text-primary hover:underline text-xs">
                        {a.customer.customerName}
                      </Link>
                    ) : a.lead ? (
                      <Link href={`/leads/${a.leadId}`} className="text-primary hover:underline text-xs">
                        {a.lead.leadName}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status === "COMPLETED" ? "success" : "secondary"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.assignedTo?.name || "Unassigned"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {a.description || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
    </div>
  );
}
