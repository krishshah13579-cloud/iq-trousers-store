import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate Limiting: Max 5 newsletter subscriptions per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const body = await req.json();
    const { firstName, lastName, email, consent } = body;

    // Validate mandatory fields
    if (!firstName || !String(firstName).trim()) {
      return NextResponse.json(
        { error: "First Name is mandatory." },
        { status: 400 }
      );
    }

    if (!lastName || !String(lastName).trim()) {
      return NextResponse.json(
        { error: "Last Name is mandatory." },
        { status: 400 }
      );
    }

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { error: "Email Address is mandatory." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!consent) {
      return NextResponse.json(
        { error: "You must agree to subscribe to the newsletter." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const discountCode = "IQTROUSERS10";

    // Ensure the discount code exists in the database
    await prisma.discount.upsert({
      where: { code: discountCode },
      update: { active: true },
      create: {
        code: discountCode,
        type: "PERCENTAGE",
        value: 10,
        minOrder: 0,
        maxUses: 1000,
        active: true,
        expiresAt: new Date("2028-12-31"),
      },
    });

    // Save or update subscriber
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalizedEmail },
      update: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        discountCode,
      },
      create: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: normalizedEmail,
        discountCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Thank you for subscribing, ${String(firstName).trim()}! Your exclusive 10% welcome discount code is ready. An email confirmation has been dispatched to ${normalizedEmail}.`,
      discountCode,
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Unable to process subscription. Please try again." },
      { status: 500 }
    );
  }
}
