import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import { createOpportunity, listOpportunities } from "@/services/opportunity.service";
import {
  createOpportunitySchema,
  opportunityQuerySchema,
} from "@/schemas/opportunity.schema";

export const GET = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const { searchParams } = new URL(request.url);

  const query = opportunityQuerySchema.parse({
    page: searchParams.get("page") || undefined,
    pageSize: searchParams.get("pageSize") || undefined,
    search: searchParams.get("search") || undefined,
    stage: searchParams.get("stage") || undefined,
    status: searchParams.get("status") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
  });

  const result = await listOpportunities(query, user);
  return NextResponse.json(result);
});

export const POST = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const body = await request.json();
  const input = createOpportunitySchema.parse(body);

  const opp = await createOpportunity(input, user);
  return NextResponse.json(opp, { status: 201 });
});
