import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { requireRole } from "@/lib/auth/session";
import { getPipelineReport } from "@/services/report.service";
import { Role } from "@prisma/client";

export const GET = withApiHandler(async () => {
  const user = await requireRole([Role.ADMIN, Role.MANAGER]);
  const data = await getPipelineReport(user);
  return NextResponse.json(data);
});
