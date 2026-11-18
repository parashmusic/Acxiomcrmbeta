"use server";

import { requireAuthUser } from "@/lib/auth/session";
import {
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
} from "@/services/followup.service";
import {
  createFollowUpSchema,
  updateFollowUpSchema,
} from "@/schemas/followup.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createFollowUpAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    customerId: formData.get("customerId") || undefined,
    leadId: formData.get("leadId") || undefined,
    opportunityId: formData.get("opportunityId") || undefined,
    followUpDate: formData.get("followUpDate"),
    subject: formData.get("subject"),
    followUpType: formData.get("followUpType"),
    remarks: formData.get("remarks") || undefined,
    status: formData.get("status") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  };

  const parsed = createFollowUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const f = await createFollowUp(parsed.data, user);
    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    return { success: true, data: { id: f.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create follow-up.",
    };
  }
}

export async function updateFollowUpAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    followUpDate: formData.get("followUpDate") || undefined,
    subject: formData.get("subject") || undefined,
    followUpType: formData.get("followUpType") || undefined,
    remarks: formData.get("remarks") !== null ? formData.get("remarks") : undefined,
    status: formData.get("status") || undefined,
    assignedToId: formData.get("assignedToId") !== null ? formData.get("assignedToId") : undefined,
  };

  const parsed = updateFollowUpSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const f = await updateFollowUp(id, parsed.data, user);
    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    return { success: true, data: { id: f.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update follow-up.",
    };
  }
}

export async function completeFollowUpAction(
  id: string,
  remarks?: string
): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await completeFollowUp(id, remarks, user);
    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to complete follow-up.",
    };
  }
}

export async function deleteFollowUpAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await deleteFollowUp(id, user);
    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete follow-up.",
    };
  }
}
