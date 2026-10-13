import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { normalizePhone } from "@/lib/utils";
import { sendWelcomeRegistrationEmail } from "@/lib/email";

export async function POST(req: Request) {
  // Rate Limiting: Max 10 registration attempts per 15 minutes per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const body = await req.json();
    const { name, email, phone, verificationCode, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "Mobile phone number is mandatory for registration." },
        { status: 400 }
      );
    }

    if (!verificationCode || typeof verificationCode !== "string" || !verificationCode.trim()) {
      return NextResponse.json(
        { error: "Phone verification code is required. Please verify your phone number." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name?.trim() || "";
    const normalizedPhone = normalizePhone(phone);
    const cleanOtp = String(verificationCode).trim();

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password cannot exceed 128 characters." },
        { status: 400 }
      );
    }

    // 1. Check if email already exists
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // 2. Check if phone is already registered to any existing account
    const existingPhoneUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingPhoneUser) {
      return NextResponse.json(
        { error: "This mobile phone number is already registered to an account. Each phone number can only be linked to one account." },
        { status: 409 }
      );
    }

    // 3. Prevent coupon abuse: Check if this phone number has already been issued a welcome coupon
    const existingCouponForPhone = await prisma.discount.findFirst({
      where: { userPhone: normalizedPhone },
    });

    if (existingCouponForPhone) {
      return NextResponse.json(
        { error: "This mobile number has already claimed a 10% welcome registration discount." },
        { status: 409 }
      );
    }

    // 4. Verify OTP code against PhoneVerification record
    const validOtpRecord = await prisma.phoneVerification.findFirst({
      where: {
        phone: normalizedPhone,
        code: cleanOtp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validOtpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired phone verification code. Please request a new code and try again." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique coupon code for this user: e.g. WELCOME-7K9M2P
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const uniqueCouponCode = `WELCOME-${randomSuffix}`;
    const couponExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // exactly 7 days

    // Create user in transaction with their unique 10% coupon
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: trimmedName || trimmedEmail.split("@")[0],
          email: trimmedEmail,
          phone: normalizedPhone,
          phoneVerified: true,
          firstDiscountCode: uniqueCouponCode,
          password: hashedPassword,
          role: "USER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          firstDiscountCode: true,
          createdAt: true,
        },
      });

      // Create unique 10% coupon valid for 7 days
      await tx.discount.create({
        data: {
          code: uniqueCouponCode,
          type: "PERCENTAGE",
          value: 10,
          minOrder: 0,
          maxUses: 1,
          usedCount: 0,
          active: true,
          expiresAt: couponExpiresAt,
          userId: newUser.id,
          userPhone: normalizedPhone,
          description: "10% First Order Welcome Discount (Valid 7 Days)",
        },
      });

      // Clean up used OTP
      await tx.phoneVerification.deleteMany({
        where: { phone: normalizedPhone },
      });

      return newUser;
    });

    // Send Welcome Email with unique coupon code
    try {
      await sendWelcomeRegistrationEmail({
        to: trimmedEmail,
        name: user.name || "Customer",
        phone: normalizedPhone,
        discountCode: uniqueCouponCode,
        expiresAt: couponExpiresAt,
      });
    } catch (emailErr) {
      console.error("Failed to send welcome registration email:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Account created successfully. Your exclusive 10% welcome coupon has been delivered to your email!",
        user,
        couponCode: uniqueCouponCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
