import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import {
  getCustomerById,
  updateCustomer,
  deactivateCustomer,
} from "@/services/customer.service";
import { updateCustomerSchema } from "@/schemas/customer.schema";

export const GET = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const customer = await getCustomerById(id, user);
    return NextResponse.json(customer);
  }
);

export const PUT = withApiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = updateCustomerSchema.parse(body);

    const customer = await updateCustomer(id, input, user);
    return NextResponse.json(customer);
  }
);

export const DELETE = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    await deactivateCustomer(id, user);
    return NextResponse.json({ success: true, message: "Customer deactivated." });
  }
);
