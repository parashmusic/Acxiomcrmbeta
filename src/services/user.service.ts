import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { ForbiddenError, NotFoundError, ConflictError } from "@/lib/api-error";
import { logAudit } from "@/services/audit.service";
import { toUserDto, UserDto } from "@/dto/user.dto";
import { CreateUserInput, UpdateUserInput } from "@/schemas/user.schema";
import { SessionUser, PaginatedResult } from "@/types";
import bcrypt from "bcryptjs";
import { Role, Prisma } from "@prisma/client";

export async function createUser(input: CreateUserInput, actor: SessionUser): Promise<UserDto> {
  if (!can(actor.role, "create", "users")) {
    throw new ForbiddenError();
  }

  const existing = await db.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: input.isActive ?? true,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "CREATE_USER",
    module: "USERS",
    entityName: "User",
    recordId: user.id,
    newValue: {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });

  return toUserDto(user);
}

export interface UserQueryFilter {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export async function listUsers(
  filter: UserQueryFilter,
  actor: SessionUser
): Promise<PaginatedResult<UserDto>> {
  if (!can(actor.role, "read", "users")) {
    throw new ForbiddenError();
  }

  const page = Math.max(1, filter.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filter.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {};

  if (filter.role) {
    where.role = filter.role;
  }
  if (filter.isActive !== undefined) {
    where.isActive = filter.isActive;
  }
  if (filter.search) {
    const s = filter.search.trim();
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    db.user.count({ where }),
  ]);

  return {
    items: items.map(toUserDto),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserById(id: string, actor: SessionUser): Promise<UserDto> {
  if (!can(actor.role, "read", "users")) {
    throw new ForbiddenError();
  }

  const user = await db.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundError("User not found.");
  }

  return toUserDto(user);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor: SessionUser
): Promise<UserDto> {
  if (!can(actor.role, "update", "users")) {
    throw new ForbiddenError();
  }

  const existing = await db.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError("User not found.");
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UPDATE_USER",
    module: "USERS",
    entityName: "User",
    recordId: id,
    oldValue: {
      name: existing.name,
      role: existing.role,
      isActive: existing.isActive,
    },
    newValue: {
      name: updated.name,
      role: updated.role,
      isActive: updated.isActive,
    },
  });

  return toUserDto(updated);
}

export async function unlockUser(id: string, actor: SessionUser): Promise<UserDto> {
  if (!can(actor.role, "update", "users")) {
    throw new ForbiddenError();
  }

  const existing = await db.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError("User not found.");
  }

  const updated = await db.user.update({
    where: { id },
    data: {
      failedLoginCount: 0,
      lockoutEnd: null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "UNLOCK_USER",
    module: "USERS",
    entityName: "User",
    recordId: id,
    oldValue: {
      failedLoginCount: existing.failedLoginCount,
      lockoutEnd: existing.lockoutEnd,
    },
    newValue: {
      failedLoginCount: 0,
      lockoutEnd: null,
    },
  });

  return toUserDto(updated);
}

export async function resetUserPassword(
  id: string,
  newPassword: string,
  actor: SessionUser
): Promise<void> {
  if (!can(actor.role, "update", "users")) {
    throw new ForbiddenError();
  }

  const existing = await db.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new NotFoundError("User not found.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockoutEnd: null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "RESET_PASSWORD",
    module: "USERS",
    entityName: "User",
    recordId: id,
  });
}

export async function getSalesExecutives() {
  const users = await db.user.findMany({
    where: {
      isActive: true,
      role: { in: [Role.SALES_EXECUTIVE, Role.MANAGER, Role.ADMIN] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: "asc" },
  });

  return users;
}
