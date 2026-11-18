import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import { createLead, listLeads } from "@/services/lead.service";
import { createLeadSchema, leadQuerySchema } from "@/schemas/lead.schema";

export const GET = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const { searchParams } = new URL(request.url);

  const query = leadQuerySchema.parse({
    page: searchParams.get("page") || undefined,
    pageSize: searchParams.get("pageSize") || undefined,
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    source: searchParams.get("source") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
  });

  const result = await listLeads(query, user);
  return NextResponse.json(result);
});

export const POST = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const body = await request.json();
  const input = createLeadSchema.parse(body);

  const lead = await createLead(input, user);
  return NextResponse.json(lead, { status: 201 });
});
