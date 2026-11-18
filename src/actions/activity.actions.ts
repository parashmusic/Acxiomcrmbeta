"use server";

import { requireAuthUser } from "@/lib/auth/session";
import {
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/services/activity.service";
import {
  createActivitySchema,
  updateActivitySchema,
} from "@/schemas/activity.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createActivityAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    activityType: formData.get("activityType"),
    subject: formData.get("subject"),
    description: formData.get("description") || undefined,
    activityDate: formData.get("activityDate"),
    customerId: formData.get("customerId") || undefined,
    leadId: formData.get("leadId") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    status: formData.get("status") || undefined,
  };

  const parsed = createActivitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const act = await createActivity(parsed.data, user);
    revalidatePath("/activities");
    revalidatePath("/dashboard");
    return { success: true, data: { id: act.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create activity.",
    };
  }
}

export async function updateActivityAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    activityType: formData.get("activityType") || undefined,
    subject: formData.get("subject") || undefined,
    description: formData.get("description") !== null ? formData.get("description") : undefined,
    activityDate: formData.get("activityDate") || undefined,
    customerId: formData.get("customerId") !== null ? formData.get("customerId") : undefined,
    leadId: formData.get("leadId") !== null ? formData.get("leadId") : undefined,
    assignedToId: formData.get("assignedToId") !== null ? formData.get("assignedToId") : undefined,
    status: formData.get("status") || undefined,
  };

  const parsed = updateActivitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const act = await updateActivity(id, parsed.data, user);
    revalidatePath("/activities");
    revalidatePath("/dashboard");
    return { success: true, data: { id: act.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update activity.",
    };
  }
}

export async function deleteActivityAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await deleteActivity(id, user);
    revalidatePath("/activities");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete activity.",
    };
  }
}
