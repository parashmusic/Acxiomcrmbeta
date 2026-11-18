import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),
    LOCKOUT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
    CRON_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    LOCKOUT_MAX_ATTEMPTS: process.env.LOCKOUT_MAX_ATTEMPTS,
    LOCKOUT_MINUTES: process.env.LOCKOUT_MINUTES,
    CRON_SECRET: process.env.CRON_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
});
