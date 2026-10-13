import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { sendPhoneVerificationEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`phone-otp:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const body = await req.json();
    const { phone, email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required to receive your verification code." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "Mobile phone number is mandatory." },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const digitCount = normalizedPhone.replace(/\D/g, "").length;

    if (digitCount < 10 || digitCount > 15) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // 1. Check if phone is already registered to an existing account
    const existingUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This mobile phone number is already registered to an account. Please sign in or use another number." },
        { status: 409 }
      );
    }

    // 2. Check if phone has already claimed a first-time discount
    const existingCoupon = await prisma.discount.findFirst({
      where: { userPhone: normalizedPhone },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "A 10% welcome coupon has already been issued for this mobile number." },
        { status: 409 }
      );
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in PhoneVerification table
    await prisma.phoneVerification.deleteMany({
      where: { phone: normalizedPhone },
    });

    await prisma.phoneVerification.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt,
      },
    });

    // Send code via email if provided
    if (email && typeof email === "string" && email.trim()) {
      await sendPhoneVerificationEmail({
        to: email.trim().toLowerCase(),
        phone: normalizedPhone,
        code,
      });
    }

    console.log(`[PHONE VERIFICATION OTP] Generated code ${code} for phone ${normalizedPhone}`);

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email.trim().toLowerCase()}. Please check your email inbox to enter the code.`,
      normalizedPhone,
    });
  } catch (error) {
    console.error("Phone OTP error:", error);
    return NextResponse.json(
      { error: "Unable to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
