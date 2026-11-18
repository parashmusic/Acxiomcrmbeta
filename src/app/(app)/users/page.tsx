import { requireRole } from "@/lib/auth/session";
import { listUsers } from "@/services/user.service";
import { getRolePermissions, Resource } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, Edit, Unlock, ShieldAlert } from "lucide-react";
import { Role } from "@prisma/client";
import { unlockUserAction } from "@/actions/user.actions";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    role?: string;
    isActive?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const currentUser = await requireRole([Role.ADMIN, Role.MANAGER]);
  const params = await searchParams;

  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);
  const search = params.search || undefined;
  const role = params.role ? (params.role as Role) : undefined;
  const isActive = params.isActive !== undefined ? params.isActive === "true" : undefined;

  const { items, total, totalPages } = await listUsers(
    { page, pageSize, search, role, isActive },
    currentUser
  );

  const permissions = getRolePermissions();
  const isAdmin = currentUser.role === Role.ADMIN;

  const roleVariants: Record<string, "destructive" | "default" | "secondary"> = {
    ADMIN: "destructive",
    MANAGER: "default",
    SALES_EXECUTIVE: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User & Role Management</h2>
          <p className="text-muted-foreground">Manage organizational accounts, roles, and lockout security.</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/users/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create User
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">System Users ({total})</TabsTrigger>
          <TabsTrigger value="permissions">Role Permission Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <form className="flex-1 max-w-sm flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  placeholder="Search by name or email..."
                  defaultValue={search || ""}
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
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Lockout Status</TableHead>
                  <TableHead>Failed Logins</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((u) => {
                    const isLocked = u.lockoutEnd && new Date(u.lockoutEnd) > new Date();

                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "-"}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleVariants[u.role] || "secondary"}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? "success" : "secondary"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isLocked ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <ShieldAlert className="h-3 w-3" /> Locked
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Normal</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{u.failedLoginCount}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {isAdmin && isLocked && (
                            <form
                              action={async () => {
                                "use server";
                                await unlockUserAction(u.id);
                              }}
                              className="inline-block"
                            >
                              <Button size="sm" variant="outline" className="text-amber-600 hover:text-amber-700">
                                <Unlock className="h-3.5 w-3.5 mr-1" /> Unlock
                              </Button>
                            </form>
                          )}
                          {isAdmin && (
                            <Button size="sm" variant="ghost" asChild>
                              <Link href={`/users/${u.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Link>
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
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <div className="rounded-md border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Central RBAC Permission Matrix</h3>
              <p className="text-sm text-muted-foreground">
                Enforced server-side in all Server Actions, REST APIs, and database queries.
              </p>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Admin Actions</TableHead>
                    <TableHead>Manager Actions</TableHead>
                    <TableHead>Sales Executive Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(Object.keys(permissions.ADMIN) as Resource[]).map((resource) => (
                    <TableRow key={resource}>
                      <TableCell className="font-medium capitalize">{resource}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(permissions.ADMIN[resource] || []).map((a) => (
                            <Badge key={a} variant="destructive" className="text-[10px] uppercase">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(permissions.MANAGER[resource] || []).map((a) => (
                            <Badge key={a} variant="default" className="text-[10px] uppercase">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(permissions.SALES_EXECUTIVE[resource] || []).length > 0 ? (
                            (permissions.SALES_EXECUTIVE[resource] || []).map((a) => (
                              <Badge key={a} variant="secondary" className="text-[10px] uppercase">
                                {a}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No access</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
