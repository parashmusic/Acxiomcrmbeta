import { NextResponse } from "next/server";
import { markOverdueFollowUpsAsMissed } from "@/services/followup.service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updatedCount = await markOverdueFollowUpsAsMissed();
  return NextResponse.json({
    success: true,
    message: `Marked ${updatedCount} overdue follow-ups as missed.`,
    updatedCount,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
