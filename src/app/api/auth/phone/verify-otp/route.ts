import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`phone-verify:${ip}`, { limit: 15, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const body = await req.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Phone number and 6-digit code are required." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const cleanCode = String(code).trim();

    const record = await prisma.phoneVerification.findFirst({
      where: {
        phone: normalizedPhone,
        code: cleanCode,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Phone number verified successfully.",
      normalizedPhone,
    });
  } catch (error) {
    console.error("Phone verification error:", error);
    return NextResponse.json(
      { error: "Unable to verify code. Please try again." },
      { status: 500 }
    );
  }
}
