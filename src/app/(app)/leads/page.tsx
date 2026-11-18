import { requireAuthUser } from "@/lib/auth/session";
import { listLeads } from "@/services/lead.service";
import { leadQuerySchema } from "@/schemas/lead.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Eye, Edit } from "lucide-react";
import { can } from "@/lib/rbac";

interface LeadsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    priority?: string;
    assignedToId?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const query = leadQuerySchema.parse({
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    search: params.search || undefined,
    status: params.status || undefined,
    priority: params.priority || undefined,
    assignedToId: params.assignedToId || undefined,
  });

  const { items, total, page, pageSize, totalPages } = await listLeads(query, user);
  const canCreate = can(user.role, "create", "leads");
  const canUpdate = can(user.role, "update", "leads");

  const statusVariants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
    NEW: "secondary",
    CONTACTED: "warning",
    QUALIFIED: "success",
    UNQUALIFIED: "secondary",
    CONVERTED: "default",
    LOST: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">Track prospects through discovery and qualification.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/leads/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Lead
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search by name, company, email, phone..."
              defaultValue={query.search || ""}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Lead Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Expected Value</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-mono text-xs font-semibold">{lead.leadCode}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline text-primary">
                      {lead.leadName}
                    </Link>
                  </TableCell>
                  <TableCell>{lead.companyName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[lead.status] || "secondary"}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        lead.priority === "HIGH"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          : lead.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {lead.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    {lead.expectedValue ? `₹${lead.expectedValue.toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>{lead.assignedTo?.name || "Unassigned"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild title="View Details">
                      <Link href={`/leads/${lead.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canUpdate && (
                      <Button variant="ghost" size="icon" asChild title="Edit Lead">
                        <Link href={`/leads/${lead.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
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
