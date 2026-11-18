"use server";

import { signIn, signOut } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { registerSchema, loginSchema } from "@/schemas/user.schema";
import bcrypt from "bcryptjs";
import { logAudit } from "@/services/audit.service";
import { ActionResult } from "@/types";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { Role } from "@prisma/client";

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || "unknown";

  const rateCheck = checkRateLimit(`login:${ip}`, 5, 60000);
  if (!rateCheck.success) {
    return {
      success: false,
      error: "Too many login attempts. Please try again in 1 minute.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return {
      success: false,
      error: "Invalid email or password.",
    };
  }
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return {
      success: false,
      error: "An account with this email address already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: Role.SALES_EXECUTIVE,
      isActive: true,
    },
  });

  await logAudit({
    userId: user.id,
    action: "REGISTER",
    module: "AUTH",
    entityName: "User",
    recordId: user.id,
    newValue: { name: user.name, email: user.email, role: user.role },
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
