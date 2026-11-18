import { auth } from "@/lib/auth/config";
import { Role } from "@prisma/client";
import { SessionUser } from "@/types";
import { can, Action, Resource } from "@/lib/rbac";
import { redirect } from "next/navigation";

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
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuthUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requirePermission(action: Action, resource: Resource): Promise<SessionUser> {
  const user = await requireAuthUser();
  if (!can(user.role, action, resource)) {
    redirect("/dashboard");
  }
  return user;
}
