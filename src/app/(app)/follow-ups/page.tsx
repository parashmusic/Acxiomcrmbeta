import { requireAuthUser } from "@/lib/auth/session";
import { listFollowUps } from "@/services/followup.service";
import { followUpQuerySchema } from "@/schemas/followup.schema";
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
import { Plus, Check, Calendar } from "lucide-react";
import { can } from "@/lib/rbac";
import { completeFollowUpAction } from "@/actions/followup.actions";
import { startOfDay } from "date-fns";

interface FollowUpsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    followUpType?: string;
    assignedToId?: string;
    customerId?: string;
    leadId?: string;
    date?: string;
  }>;
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const query = followUpQuerySchema.parse({
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    status: params.status || undefined,
    followUpType: params.followUpType || undefined,
    assignedToId: params.assignedToId || undefined,
    customerId: params.customerId || undefined,
    leadId: params.leadId || undefined,
    date: params.date || undefined,
  });

  const { items, total, page, pageSize, totalPages } = await listFollowUps(query, user);
  const canCreate = can(user.role, "create", "follow-ups");
  const canUpdate = can(user.role, "update", "follow-ups");

  const today = startOfDay(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Follow-Ups</h2>
          <p className="text-muted-foreground">Manage client calls, meetings, emails, and tasks.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/follow-ups/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Schedule Follow-Up
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/follow-ups"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            !params.status ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          All
        </Link>
        <Link
          href="/follow-ups?status=PLANNED"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.status === "PLANNED" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Planned
        </Link>
        <Link
          href="/follow-ups?status=COMPLETED"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.status === "COMPLETED" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Completed
        </Link>
        <Link
          href="/follow-ups?status=MISSED"
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
            params.status === "MISSED" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          }`}
        >
          Missed
        </Link>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No follow-ups found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((f) => {
                const isOverdue =
                  f.status === "PLANNED" && startOfDay(new Date(f.followUpDate)) < today;

                return (
                  <TableRow key={f.id} className={isOverdue ? "bg-red-500/5" : undefined}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={isOverdue ? "text-destructive font-semibold" : "font-medium"}>
                          {new Date(f.followUpDate).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0 uppercase">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{f.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{f.followUpType}</Badge>
                    </TableCell>
                    <TableCell>
                      {f.customer ? (
                        <Link href={`/customers/${f.customerId}`} className="text-primary hover:underline text-xs">
                          {f.customer.customerName}
                        </Link>
                      ) : f.lead ? (
                        <Link href={`/leads/${f.leadId}`} className="text-primary hover:underline text-xs">
                          {f.lead.leadName}
                        </Link>
                      ) : f.opportunity ? (
                        <Link href={`/opportunities/${f.opportunityId}`} className="text-primary hover:underline text-xs">
                          {f.opportunity.opportunityName}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          f.status === "COMPLETED"
                            ? "success"
                            : f.status === "MISSED"
                            ? "destructive"
                            : f.status === "CANCELLED"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{f.assignedTo?.name || "Unassigned"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {f.remarks || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {canUpdate && f.status === "PLANNED" && (
                        <form
                          action={async () => {
                            "use server";
                            await completeFollowUpAction(f.id, "Marked complete");
                          }}
                          className="inline-block"
                        >
                          <Button size="sm" variant="ghost" className="h-8 text-emerald-600 hover:text-emerald-700" title="Mark Complete">
                            <Check className="h-4 w-4 mr-1" /> Complete
                          </Button>
                        </form>
                      )}
                      {canUpdate && (
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/follow-ups/${f.id}/edit`}>Edit</Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} />
    </div>
  );
}
