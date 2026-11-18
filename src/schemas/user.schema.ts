import { z } from "zod";
import { Role } from "@prisma/client";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one digit.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name cannot exceed 100 characters."),
  email: z.string().email("Enter a valid email address."),
  password: passwordSchema,
});

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name cannot exceed 100 characters."),
  email: z.string().email("Enter a valid email address."),
  password: passwordSchema,
  role: z.nativeEnum(Role).default(Role.SALES_EXECUTIVE),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name cannot exceed 100 characters.").optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export const adminResetPasswordSchema = z.object({
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
