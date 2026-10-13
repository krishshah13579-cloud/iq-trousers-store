import { NextRequest, NextResponse } from "next/server";
import { TWO_FACTOR_COOKIE } from "@/lib/twoFactor";

// Known auth and session cookies across NextAuth and custom auth flows
const KNOWN_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Host-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "next-auth.pkce.code_verifier",
  "__Secure-next-auth.pkce.code_verifier",
  "next-auth.state",
  "__Secure-next-auth.state",
  TWO_FACTOR_COOKIE,
  "admin_2fa_verified",
];

function expireAllCookies(res: NextResponse, reqCookies: { name: string }[]) {
  // Combine known cookies with any cookies present on the incoming request
  const cookieNames = new Set([
    ...KNOWN_COOKIES,
    ...reqCookies.map((c) => c.name),
  ]);

  cookieNames.forEach((name) => {
    const isSecurePrefix = name.startsWith("__Secure-") || name.startsWith("__Host-");
    const isSecure = isSecurePrefix || process.env.NODE_ENV === "production";

    // Expire HTTP-only cookie with maxAge 0 and epoch date
    res.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
    });

    // Also trigger delete method
    res.cookies.delete(name);
  });
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({
    success: true,
    message: "Logged out and all session cookies invalidated successfully.",
  });

  expireAllCookies(res, req.cookies.getAll());
  return res;
}

export async function GET(req: NextRequest) {
  // If accessed directly via browser GET navigation, redirect immediately to homepage
  const res = NextResponse.redirect(new URL("/", req.url));
  expireAllCookies(res, req.cookies.getAll());
  return res;
}
