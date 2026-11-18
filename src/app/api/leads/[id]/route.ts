import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import { getLeadById, updateLead, deleteLead } from "@/services/lead.service";
import { updateLeadSchema } from "@/schemas/lead.schema";

export const GET = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const lead = await getLeadById(id, user);
    return NextResponse.json(lead);
  }
);

export const PUT = withApiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = updateLeadSchema.parse(body);

    const lead = await updateLead(id, input, user);
    return NextResponse.json(lead);
  }
);

export const DELETE = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    await deleteLead(id, user);
    return NextResponse.json({ success: true, message: "Lead deleted." });
  }
);
