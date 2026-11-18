import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { loginSchema } from "@/schemas/user.schema";
import { logAudit } from "@/services/audit.service";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials, request) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const ipAddress = request?.headers?.get("x-forwarded-for") || "unknown";

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          await logAudit({
            action: "LOGIN_FAILED",
            module: "AUTH",
            entityName: "User",
            result: "FAILURE",
            newValue: { email, reason: "Invalid credentials" },
            ipAddress,
          });
          return null;
        }

        if (!user.isActive) {
          await logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            module: "AUTH",
            entityName: "User",
            recordId: user.id,
            result: "FAILURE",
            newValue: { reason: "User inactive" },
            ipAddress,
          });
          return null;
        }

        const now = new Date();
        if (user.lockoutEnd && user.lockoutEnd > now) {
          await logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            module: "AUTH",
            entityName: "User",
            recordId: user.id,
            result: "FAILURE",
            newValue: { reason: "Account locked", lockoutEnd: user.lockoutEnd },
            ipAddress,
          });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          const maxAttempts = Number(process.env.LOCKOUT_MAX_ATTEMPTS || 5);
          const lockoutMinutes = Number(process.env.LOCKOUT_MINUTES || 15);
          const failedCount = user.failedLoginCount + 1;
          const isLocking = failedCount >= maxAttempts;

          const lockoutEnd = isLocking ? new Date(Date.now() + lockoutMinutes * 60 * 1000) : null;

          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failedCount,
              ...(lockoutEnd ? { lockoutEnd } : {}),
            },
          });

          if (isLocking) {
            await logAudit({
              userId: user.id,
              action: "ACCOUNT_LOCKED",
              module: "AUTH",
              entityName: "User",
              recordId: user.id,
              result: "SUCCESS",
              newValue: { failedAttempts: failedCount, lockoutEnd },
              ipAddress,
            });
          }

          await logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            module: "AUTH",
            entityName: "User",
            recordId: user.id,
            result: "FAILURE",
            newValue: { reason: "Invalid credentials", attempt: failedCount },
            ipAddress,
          });

          return null;
        }

        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: 0,
            lockoutEnd: null,
          },
        });

        await logAudit({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          module: "AUTH",
          entityName: "User",
          recordId: user.id,
          result: "SUCCESS",
          ipAddress,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});
