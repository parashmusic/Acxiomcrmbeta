import { auth } from "@/lib/auth/config";
import { Role } from "@prisma/client";
import { SessionUser } from "@/types";
import { ForbiddenError, UnauthorizedError } from "@/lib/api-error";
import { can, Action, Resource } from "@/lib/rbac";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email!,
    role: session.user.role,
  };
}

export async function requireAuthUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("You must be logged in to perform this action.");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuthUser();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError("You do not have permission to access this resource.");
  }
  return user;
}

export async function requirePermission(action: Action, resource: Resource): Promise<SessionUser> {
  const user = await requireAuthUser();
  if (!can(user.role, action, resource)) {
    throw new ForbiddenError("You do not have permission to perform this action.");
  }
  return user;
}
