"use server";

import { requireAuthUser } from "@/lib/auth/session";
import {
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from "@/services/opportunity.service";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
} from "@/schemas/opportunity.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createOpportunityAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    opportunityName: formData.get("opportunityName"),
    customerId: formData.get("customerId"),
    leadId: formData.get("leadId") || undefined,
    amount: formData.get("amount"),
    stage: formData.get("stage") || undefined,
    probability: formData.get("probability") || undefined,
    expectedCloseDate: formData.get("expectedCloseDate"),
    status: formData.get("status") || undefined,
    source: formData.get("source") || undefined,
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  };

  const parsed = createOpportunitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const opp = await createOpportunity(parsed.data, user);
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");
    return { success: true, data: { id: opp.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create opportunity.",
    };
  }
}

export async function updateOpportunityAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    opportunityName: formData.get("opportunityName") || undefined,
    customerId: formData.get("customerId") || undefined,
    leadId: formData.get("leadId") !== null ? formData.get("leadId") : undefined,
    amount: formData.get("amount") || undefined,
    stage: formData.get("stage") || undefined,
    probability: formData.get("probability") !== null ? formData.get("probability") : undefined,
    expectedCloseDate: formData.get("expectedCloseDate") || undefined,
    status: formData.get("status") || undefined,
    source: formData.get("source") || undefined,
    notes: formData.get("notes") !== null ? formData.get("notes") : undefined,
    assignedToId: formData.get("assignedToId") !== null ? formData.get("assignedToId") : undefined,
  };

  const parsed = updateOpportunitySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const opp = await updateOpportunity(id, parsed.data, user);
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: { id: opp.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update opportunity.",
    };
  }
}

export async function deleteOpportunityAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await deleteOpportunity(id, user);
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete opportunity.",
    };
  }
}
