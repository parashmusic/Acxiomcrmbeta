import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-error";
import { signOut } from "@/lib/auth/config";

export const POST = withApiHandler(async () => {
  await signOut({ redirect: false });
  return NextResponse.json({ success: true, message: "Logged out successfully." });
});
