import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends ApiError {
  constructor(details: Array<{ field?: string; message: string }>, message = "Validation failed") {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, "RATE_LIMITED", message);
  }
}

export function formatErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      },
      { status: err.statusCode }
    );
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details,
        },
      },
      { status: 400 }
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const targets = (err.meta?.target as string[]) || [];
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE_ENTRY",
            message: "Record already exists with this unique value.",
            details: targets.map((field) => ({ field, message: `${field} already exists` })),
          },
        },
        { status: 409 }
      );
    }

    if (err.code === "P2025") {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Record not found",
          },
        },
        { status: 404 }
      );
    }
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}

export function withApiHandler<T, C = unknown>(
  handler: (request: Request, context: C) => Promise<NextResponse<T> | Response>
) {
  return async (request: Request, context: C) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
}
