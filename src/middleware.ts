import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets, Next.js internal files, public images, and api auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  let token = null;
  try {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
  } catch {
    token = null;
  }

  const role = token?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isLoggedIn = !!token;

  // Protect Admin Portal: Only authorized administrators may access /admin
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Protect Admin APIs: Non-admins cannot access /api/admin
  if (pathname.startsWith("/api/admin") && !isAdmin) {
    return NextResponse.json(
      { error: "Access Denied: Administrative privileges required." },
      { status: 403 }
    );
  }

  // If already logged in, visiting auth pages redirects automatically as per role
  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
