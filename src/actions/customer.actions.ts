"use server";

import { requireAuthUser } from "@/lib/auth/session";
import { createCustomer, updateCustomer, deactivateCustomer } from "@/services/customer.service";
import { createCustomerSchema, updateCustomerSchema } from "@/schemas/customer.schema";
import { ActionResult } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
  };

  const parsed = createCustomerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const customer = await createCustomer(parsed.data, user);
    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true, data: { id: customer.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create customer.",
    };
  }
}

export async function updateCustomerAction(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuthUser();

  const rawData = {
    customerName: formData.get("customerName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    companyName: formData.get("companyName") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    notes: formData.get("notes") || undefined,
    assignedToId: formData.get("assignedToId") || undefined,
    status: formData.get("status") || undefined,
  };

  const parsed = updateCustomerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const customer = await updateCustomer(id, parsed.data, user);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/dashboard");
    return { success: true, data: { id: customer.id } };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update customer.",
    };
  }
}

export async function deactivateCustomerAction(id: string): Promise<ActionResult> {
  const user = await requireAuthUser();

  try {
    await deactivateCustomer(id, user);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to deactivate customer.",
    };
  }
}
