import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import { createFollowUp, listFollowUps } from "@/services/followup.service";
import {
  createFollowUpSchema,
  followUpQuerySchema,
} from "@/schemas/followup.schema";

export const GET = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const { searchParams } = new URL(request.url);

  const query = followUpQuerySchema.parse({
    page: searchParams.get("page") || undefined,
    pageSize: searchParams.get("pageSize") || undefined,
    search: searchParams.get("search") || undefined,
    status: searchParams.get("status") || undefined,
    followUpType: searchParams.get("followUpType") || undefined,
    assignedToId: searchParams.get("assignedToId") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    leadId: searchParams.get("leadId") || undefined,
    opportunityId: searchParams.get("opportunityId") || undefined,
    date: searchParams.get("date") || undefined,
  });

  const result = await listFollowUps(query, user);
  return NextResponse.json(result);
});

export const POST = withApiHandler(async (request: Request) => {
  const user = await requireAuthUser();
  const body = await request.json();
  const input = createFollowUpSchema.parse(body);

  const followUp = await createFollowUp(input, user);
  return NextResponse.json(followUp, { status: 201 });
});
