import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireAuthUser } from "@/lib/auth/session";
import {
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
} from "@/services/followup.service";
import { updateFollowUpSchema } from "@/schemas/followup.schema";

export const GET = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const followUp = await getFollowUpById(id, user);
    return NextResponse.json(followUp);
  }
);

export const PUT = withApiHandler(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = updateFollowUpSchema.parse(body);

    const followUp = await updateFollowUp(id, input, user);
    return NextResponse.json(followUp);
  }
);

export const DELETE = withApiHandler(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const user = await requireAuthUser();
    const { id } = await context.params;
    await deleteFollowUp(id, user);
    return NextResponse.json({ success: true, message: "Follow-up deleted." });
  }
);
