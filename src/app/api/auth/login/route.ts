import { NextResponse } from "next/server";
import { withApiHandler, RateLimitError, UnauthorizedError } from "@/lib/api-error";
import { loginSchema } from "@/schemas/user.schema";
import { checkRateLimit } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logAudit } from "@/services/audit.service";
import { toUserDto } from "@/dto/user.dto";

export const POST = withApiHandler(async (request: Request) => {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rateLimit = checkRateLimit(`api-login:${ip}`, 5, 60000);

  if (!rateLimit.success) {
    throw new RateLimitError();
  }

  const body = await request.json();
  const parsed = loginSchema.parse(body);

  const user = await db.user.findUnique({
    where: { email: parsed.email },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    await logAudit({
      action: "API_LOGIN_FAILED",
      module: "AUTH",
      entityName: "User",
      result: "FAILURE",
      newValue: { email: parsed.email },
      ipAddress: ip,
    });
    throw new UnauthorizedError("Invalid email or password.");
  }

  const now = new Date();
  if (user.lockoutEnd && user.lockoutEnd > now) {
    await logAudit({
      userId: user.id,
      action: "API_LOGIN_LOCKED",
      module: "AUTH",
      entityName: "User",
      recordId: user.id,
      result: "FAILURE",
      ipAddress: ip,
    });
    throw new UnauthorizedError("Account is locked. Please try again later.");
  }

  const isValid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isValid) {
    const maxAttempts = Number(process.env.LOCKOUT_MAX_ATTEMPTS || 5);
    const lockoutMinutes = Number(process.env.LOCKOUT_MINUTES || 15);
    const count = user.failedLoginCount + 1;
    const shouldLock = count >= maxAttempts;
    const lockoutEnd = shouldLock ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null;

    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: count,
        ...(lockoutEnd ? { lockoutEnd } : {}),
      },
    });

    await logAudit({
      userId: user.id,
      action: "API_LOGIN_FAILED",
      module: "AUTH",
      entityName: "User",
      recordId: user.id,
      result: "FAILURE",
      ipAddress: ip,
    });

    throw new UnauthorizedError("Invalid email or password.");
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockoutEnd: null },
  });

  await logAudit({
    userId: user.id,
    action: "API_LOGIN_SUCCESS",
    module: "AUTH",
    entityName: "User",
    recordId: user.id,
    result: "SUCCESS",
    ipAddress: ip,
  });

  return NextResponse.json({
    user: toUserDto(user),
    message: "Authentication successful.",
  });
});
