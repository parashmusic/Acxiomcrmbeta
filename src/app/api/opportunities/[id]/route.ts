import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import {
  getOpportunityById,
  updateOpportunity,
  deleteOpportunity,
} from "@/services/opportunity.service";
import { updateOpportunitySchema } from "@/schemas/opportunity.schema";

export const GET = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const opp = await getOpportunityById(id, user);
    return NextResponse.json(opp);
  }
);

export const PUT = withApiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = updateOpportunitySchema.parse(body);

    const opp = await updateOpportunity(id, input, user);
    return NextResponse.json(opp);
  }
);

export const DELETE = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    await deleteOpportunity(id, user);
    return NextResponse.json({ success: true, message: "Opportunity deleted." });
  }
);
