"use server";

import { requireAuthUser } from "@/lib/auth/session";
import { createLead, updateLead, convertLead, deleteLead } from "@/services/lead.service";
import { createLeadSchema, updateLeadSchema, convertLeadSchema } from "@/schemas/lead.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createLeadAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    leadName: formData.get("leadName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    companyName: formData.get("companyName") || undefined,
    source: formData.get("source") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    expectedValue: formData.get("expectedValue") || undefined,
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  };

  const parsed = createLeadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const lead = await createLead(parsed.data, user);
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true, data: { id: lead.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create lead.",
    };
  }
}

export async function updateLeadAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    leadName: formData.get("leadName") || undefined,
    email: formData.get("email") !== null ? formData.get("email") : undefined,
    phone: formData.get("phone") !== null ? formData.get("phone") : undefined,
    companyName: formData.get("companyName") !== null ? formData.get("companyName") : undefined,
    source: formData.get("source") || undefined,
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    expectedValue: formData.get("expectedValue") !== null ? formData.get("expectedValue") : undefined,
    notes: formData.get("notes") !== null ? formData.get("notes") : undefined,
    assignedToId: formData.get("assignedToId") !== null ? formData.get("assignedToId") : undefined,
  };

  const parsed = updateLeadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const lead = await updateLead(id, parsed.data, user);
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: { id: lead.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update lead.",
    };
  }
}

export async function convertLeadAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ customerId: string; opportunityId?: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    createOpportunity: formData.get("createOpportunity") === "true",
    opportunityName: formData.get("opportunityName") || undefined,
    amount: formData.get("amount") || undefined,
    expectedCloseDate: formData.get("expectedCloseDate") || undefined,
  };

  const parsed = convertLeadSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const result = await convertLead(id, parsed.data, user);
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    revalidatePath("/customers");
    revalidatePath("/opportunities");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to convert lead.",
    };
  }
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await deleteLead(id, user);
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete lead.",
    };
  }
}
