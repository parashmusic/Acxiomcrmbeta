import { describe, it, expect } from "vitest";
import { can, scopeFilter } from "@/lib/rbac";
import { Role } from "@prisma/client";

describe("RBAC Permissions", () => {
  it("allows admin full access to users and audit logs", () => {
    expect(can(Role.ADMIN, "read", "users")).toBe(true);
    expect(can(Role.ADMIN, "create", "users")).toBe(true);
    expect(can(Role.ADMIN, "read", "audit-logs")).toBe(true);
    expect(can(Role.ADMIN, "delete", "customers")).toBe(true);
  });

  it("restricts manager from security role management and creating users", () => {
    expect(can(Role.MANAGER, "read", "users")).toBe(true);
    expect(can(Role.MANAGER, "create", "users")).toBe(false);
    expect(can(Role.MANAGER, "create", "roles")).toBe(false);
    expect(can(Role.MANAGER, "read", "customers")).toBe(true);
  });

  it("restricts sales executive to own operational scope", () => {
    expect(can(Role.SALES_EXECUTIVE, "read", "users")).toBe(false);
    expect(can(Role.SALES_EXECUTIVE, "create", "users")).toBe(false);
    expect(can(Role.SALES_EXECUTIVE, "read", "audit-logs")).toBe(false);
    expect(can(Role.SALES_EXECUTIVE, "delete", "customers")).toBe(false);
    expect(can(Role.SALES_EXECUTIVE, "create", "customers")).toBe(true);
    expect(can(Role.SALES_EXECUTIVE, "read", "customers")).toBe(true);
  });

  it("applies scopeFilter according to role", () => {
    const adminUser = { id: "admin-1", role: Role.ADMIN, email: "admin@test.com" };
    const managerUser = { id: "mgr-1", role: Role.MANAGER, email: "mgr@test.com" };
    const salesUser = { id: "sales-1", role: Role.SALES_EXECUTIVE, email: "sales@test.com" };

    expect(scopeFilter(adminUser)).toEqual({});
    expect(scopeFilter(managerUser)).toEqual({});
    expect(scopeFilter(salesUser)).toEqual({ assignedToId: "sales-1" });
  });
});

