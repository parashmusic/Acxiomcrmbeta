import { requireAuthUser } from "@/lib/auth/session";
import { listCustomers } from "@/services/customer.service";
import { customerQuerySchema } from "@/schemas/customer.schema";
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

interface CustomersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    assignedToId?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await requireAuthUser();
  const params = await searchParams;

  const query = customerQuerySchema.parse({
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    search: params.search || undefined,
    status: params.status || undefined,
    assignedToId: params.assignedToId || undefined,
  });

  const { items, total, page, pageSize, totalPages } = await listCustomers(query, user);
  const canCreate = can(user.role, "create", "customers");
  const canUpdate = can(user.role, "update", "customers");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">Manage client accounts and relationship history.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/customers/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Customer
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
              placeholder="Search by name, email, phone, company..."
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
              <TableHead>Customer Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-xs font-semibold">{customer.customerCode}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:underline text-primary">
                      {customer.customerName}
                    </Link>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{customer.companyName || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === "ACTIVE" ? "success" : "secondary"}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{customer.assignedTo?.name || "Unassigned"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" asChild title="View Details">
                      <Link href={`/customers/${customer.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {canUpdate && (
                      <Button variant="ghost" size="icon" asChild title="Edit Customer">
                        <Link href={`/customers/${customer.id}/edit`}>
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
