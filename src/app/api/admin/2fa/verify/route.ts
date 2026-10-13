import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  TWO_FACTOR_COOKIE,
  createTwoFactorToken,
} from "@/lib/twoFactor";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "User session missing ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { code, rememberDevice } = body;

    const trimmedCode = String(code || "").trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      return NextResponse.json(
        { error: "Please enter the valid 6-digit verification code sent to your email." },
        { status: 400 }
      );
    }

    // Verify directly from the database record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorCode: true,
        twoFactorExpires: true,
      },
    });

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Administrative record not found in database" },
        { status: 403 }
      );
    }

    if (!user.twoFactorCode || !user.twoFactorExpires) {
      return NextResponse.json(
        { error: "No active verification code found. Please request a new code to be sent to your email." },
        { status: 400 }
      );
    }

    const now = new Date();
    const isExpired = new Date(user.twoFactorExpires) <= now;
    if (isExpired) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code to be sent to your email." },
        { status: 400 }
      );
    }

    // Strict direct database code verification
    if (user.twoFactorCode !== trimmedCode) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your email inbox and enter the code accurately." },
        { status: 400 }
      );
    }

    // One-time consumption: immediately wipe code and expiration from database to prevent replay
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: null,
        twoFactorExpires: null,
      },
    });

    // Generate cryptographic HMAC-SHA256 signed token
    const token = createTwoFactorToken(user.id);
    const maxAge = rememberDevice ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days vs 24 hours

    const res = NextResponse.json({
      success: true,
      message: "Administrative identity verified successfully.",
    });

    // Set secure HTTP-only cookie
    res.cookies.set({
      name: TWO_FACTOR_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return res;
  } catch (error) {
    console.error("2FA direct database verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify authentication code. Please try again." },
      { status: 500 }
    );
  }
}
