import { Role } from "@prisma/client";
import { SessionUser } from "@/types";

export type Resource =
  | "dashboard"
  | "customers"
  | "leads"
  | "opportunities"
  | "follow-ups"
  | "activities"
  | "users"
  | "roles"
  | "audit-logs"
  | "reports";

export type Action = "create" | "read" | "update" | "delete" | "export" | "convert";

const permissionMatrix: Record<Role, Record<Resource, Action[]>> = {
  ADMIN: {
    dashboard: ["read", "export"],
    customers: ["create", "read", "update", "delete", "export"],
    leads: ["create", "read", "update", "delete", "export", "convert"],
    opportunities: ["create", "read", "update", "delete", "export"],
    "follow-ups": ["create", "read", "update", "delete", "export"],
    activities: ["create", "read", "update", "delete", "export"],
    users: ["create", "read", "update", "delete", "export"],
    roles: ["create", "read", "update", "delete"],
    "audit-logs": ["read", "export"],
    reports: ["read", "export"],
  },
  MANAGER: {
    dashboard: ["read", "export"],
    customers: ["create", "read", "update", "delete", "export"],
    leads: ["create", "read", "update", "delete", "export", "convert"],
    opportunities: ["create", "read", "update", "delete", "export"],
    "follow-ups": ["create", "read", "update", "delete", "export"],
    activities: ["create", "read", "update", "delete", "export"],
    users: ["read"],
    roles: [],
    "audit-logs": ["read"],
    reports: ["read", "export"],
  },
  SALES_EXECUTIVE: {
    dashboard: ["read"],
    customers: ["create", "read", "update"],
    leads: ["create", "read", "update", "convert"],
    opportunities: ["create", "read", "update"],
    "follow-ups": ["create", "read", "update", "delete"],
    activities: ["create", "read", "update", "delete"],
    users: [],
    roles: [],
    "audit-logs": [],
    reports: ["read", "export"],
  },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  const allowedActions = permissionMatrix[role]?.[resource];
  if (!allowedActions) return false;
  return allowedActions.includes(action);
}

export function scopeFilter(user: SessionUser): Record<string, unknown> {
  if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
    return {};
  }
  return { assignedToId: user.id };
}

export function getRolePermissions() {
  return permissionMatrix;
}
