import { NextResponse } from "next/server";
import { TWO_FACTOR_COOKIE } from "@/lib/twoFactor";

export async function POST() {
  const res = NextResponse.json({
    success: true,
    message: "Two-factor authentication locked.",
  });

  res.cookies.set({
    name: TWO_FACTOR_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
