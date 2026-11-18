import { requireRole } from "@/lib/auth/session";
import { getAuditLogs } from "@/services/audit.service";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data-table/pagination";
import { Role } from "@prisma/client";
import { ShieldCheck, Search } from "lucide-react";

interface AuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    module?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await requireRole([Role.ADMIN]);
  const params = await searchParams;

  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 15);
  const moduleName = params.module || undefined;
  const action = params.action || undefined;
  const userId = params.userId || undefined;
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  const { items, total, totalPages } = await getAuditLogs({
    page,
    pageSize,
    module: moduleName,
    action,
    userId,
    startDate,
    endDate,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          </div>
          <p className="text-muted-foreground">
            Immutable, append-only security and operational audit trail.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <form className="flex items-center gap-2 flex-wrap">
          <Input
            name="module"
            placeholder="Filter module (e.g. AUTH, CUSTOMERS)"
            defaultValue={moduleName || ""}
            className="w-48 text-xs"
          />
          <Input
            name="action"
            placeholder="Filter action (e.g. LOGIN_SUCCESS)"
            defaultValue={action || ""}
            className="w-48 text-xs"
          />
          <Button type="submit" variant="secondary" size="sm" className="flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> Filter
          </Button>
        </form>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No audit logs recorded matching this criteria.
                </TableCell>
              </TableRow>
            ) : (
              items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {log.module}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{log.action}</TableCell>
                  <TableCell className="text-xs">{log.entityName}</TableCell>
                  <TableCell className="text-xs">
                    {log.user ? `${log.user.name || log.user.email}` : "System / Anonymous"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.result === "SUCCESS" ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {log.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                    {log.newValue ? JSON.stringify(log.newValue) : "-"}
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
