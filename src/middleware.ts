import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Checks for path traversal and directory crawling patterns:
 * - Literal '..' or '../' or '..\'
 * - URL encoded '%2e%2e' or double-encoded '%252e'
 * - Overlong UTF-8 bypasses (%c0%ae, %c0%af)
 * - Null byte injections (%00, \0)
 * - Prohibited access to system files (.env, .git, package.json, prisma, etc.)
 */
function isPathTraversalAttempt(rawUrl: string, pathname: string, search: string): boolean {
  const inputsToCheck = [rawUrl, pathname, search];

  for (const input of inputsToCheck) {
    if (!input) continue;

    // Check for null byte
    if (input.includes("\0") || /%00/i.test(input)) {
      return true;
    }

    // Direct pattern check
    if (
      /\.\./.test(input) ||
      /%2e%2e/i.test(input) ||
      /%252e/i.test(input) ||
      /%c0%ae/i.test(input) ||
      /%c0%af/i.test(input)
    ) {
      return true;
    }

    // Recursive URL decode check (catches double/triple URL encoding)
    try {
      let decoded = input;
      for (let i = 0; i < 3; i++) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      }
      const normalized = decoded.replace(/\\/g, "/");
      if (
        normalized.includes("..") ||
        /\/\.\.(?:\/|$)/.test(normalized) ||
        /^\.\.(?:\/|$)/.test(normalized)
      ) {
        return true;
      }
    } catch {
      // Malformed URI encoding is rejected
      return true;
    }
  }

  // Check for attempts to access protected/system paths
  const lowerPath = pathname.toLowerCase();
  const blockedExactOrPrefix = [
    "/.env",
    "/.git",
    "/.github",
    "/.system_generated",
    "/package.json",
    "/package-lock.json",
    "/tsconfig.json",
    "/next.config",
    "/prisma",
    "/node_modules",
    "/etc",
    "/proc",
    "/sys",
    "/windows",
  ];

  for (const prefix of blockedExactOrPrefix) {
    if (
      lowerPath === prefix ||
      lowerPath.startsWith(prefix + "/") ||
      lowerPath.startsWith(prefix + ".")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Determines whether current time in Indian Standard Time (IST, UTC+5:30)
 * falls within the scheduled nightly maintenance window: 1:00 AM to 6:00 AM IST.
 */
function isMaintenanceHours(): boolean {
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  // Indian Standard Time is UTC + 5:30 (330 minutes)
  const istMinutes = (utcMinutes + 330) % 1440;
  const istHour = Math.floor(istMinutes / 60);
  // Active window: 1:00 AM to 6:00 AM IST (hours 1, 2, 3, 4, 5)
  return istHour >= 1 && istHour < 6;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const rawUrl = req.url || "";

  // 1. GLOBAL PATH TRAVERSAL & DIRECTORY CRAWLING DEFENSE
  // Protects all routes, assets, APIs, and query parameters against ../ traversal
  if (isPathTraversalAttempt(rawUrl, pathname, search)) {
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied: Directory traversal and unauthorized path crawling are strictly forbidden.",
        code: "SECURITY_PATH_TRAVERSAL_BLOCKED",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      }
    );
  }

  // 2. Fetch session token for authorization
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

  // 3. SCHEDULED NIGHTLY MAINTENANCE WINDOW (1:00 AM - 6:00 AM IST)
  // When active, customer-facing storefront routes are rewritten to /maintenance.html
  // Admins, health checks, static assets, and bypass query/cookies are exempted.
  const hasBypassQuery = search.includes("bypass_maintenance=true") || search.includes("admin_preview=true");
  const hasBypassCookie = req.cookies.get("maintenance_bypass")?.value === "true";
  const isBypassed = isAdmin || hasBypassQuery || hasBypassCookie;

  const isExemptPath =
    pathname === "/maintenance" ||
    pathname === "/maintenance.html" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico" ||
    pathname === "/iq-trousers-logo-transparent.png";

  if (isMaintenanceHours() && !isBypassed && !isExemptPath) {
    const maintenanceUrl = new URL("/maintenance.html", req.url);
    const response = NextResponse.rewrite(maintenanceUrl);
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("Retry-After", "21600");
    return response;
  }

  // Persist bypass cookie if requested by admin via query
  if (hasBypassQuery && !hasBypassCookie) {
    const res = NextResponse.next();
    res.cookies.set("maintenance_bypass", "true", {
      path: "/",
      maxAge: 86400,
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  // 4. Protect Admin APIs: Non-admins cannot access /api/admin
  if (pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Access Denied: Administrative privileges required." },
        { status: 403 }
      );
    }
  }

  // 4. Protect Admin Portal: Only authorized administrators may access /admin
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

  // 5. If already logged in, visiting auth pages redirects automatically as per role
  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 6. Skip static assets, Next.js internal files, and public files for remaining checks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static Next.js assets
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
