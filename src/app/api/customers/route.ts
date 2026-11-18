import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import { createCustomer, listCustomers } from "@/services/customer.service";
import { createCustomerSchema, customerQuerySchema } from "@/schemas/customer.schema";

export const GET = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const { searchParams } = new URL(request.url);

  const query = customerQuerySchema.parse({
    page: searchParams.get("page") || undefined,
    pageSize: searchParams.get("pageSize") || undefined,
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
  });

  const result = await listCustomers(query, user);
  return NextResponse.json(result);
});

export const POST = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const body = await request.json();
  const input = createCustomerSchema.parse(body);

  const customer = await createCustomer(input, user);
  return NextResponse.json(customer, { status: 201 });
});
