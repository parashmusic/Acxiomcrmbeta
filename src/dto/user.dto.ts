import { User, Role } from "@prisma/client";

export interface UserDto {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  failedLoginCount: number;
  lockoutEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    failedLoginCount: user.failedLoginCount,
    lockoutEnd: user.lockoutEnd,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
