import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/docs") ||
    pathname.startsWith("/api/cron");

  if (isPublicApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access this endpoint.",
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
