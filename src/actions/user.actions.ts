"use server";

import { requireAuthUser } from "@/lib/auth/session";
import {
  createUser,
  updateUser,
  unlockUser,
  resetUserPassword,
} from "@/services/user.service";
import {
  createUserSchema,
  updateUserSchema,
  adminResetPasswordSchema,
} from "@/schemas/user.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") || undefined,
    isActive: formData.get("isActive") !== "false",
  };

  const parsed = createUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const created = await createUser(parsed.data, user);
    revalidatePath("/users");
    revalidatePath("/dashboard");
    return { success: true, data: { id: created.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create user.",
    };
  }
}

export async function updateUserAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    name: formData.get("name") || undefined,
    role: formData.get("role") || undefined,
    isActive: formData.get("isActive") !== null ? formData.get("isActive") === "true" : undefined,
  };

  const parsed = updateUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const updated = await updateUser(id, parsed.data, user);
    revalidatePath("/users");
    revalidatePath(`/users/${id}/edit`);
    revalidatePath("/dashboard");
    return { success: true, data: { id: updated.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update user.",
    };
  }
}

export async function unlockUserAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await unlockUser(id, user);
    revalidatePath("/users");
    revalidatePath(`/users/${id}/edit`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to unlock user.",
    };
  }
}

export async function resetUserPasswordAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuthUser();

  const rawData = {
    password: formData.get("password"),
  };

  const parsed = adminResetPasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await resetUserPassword(id, parsed.data.password, user);
    revalidatePath("/users");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reset password.",
    };
  }
}
