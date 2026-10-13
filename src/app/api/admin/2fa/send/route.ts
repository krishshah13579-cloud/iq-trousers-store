import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTwoFactorCode, CODE_EXPIRATION_MINUTES } from "@/lib/twoFactor";
import { sendTwoFactorEmail } from "@/lib/email";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "User session missing ID" }, { status: 400 });
  }

  // Rate Limiting: Max 4 requests per 5 minutes per user/IP
  const ip = getClientIp(req);
  const rateLimitKey = `2fa-send:${userId}:${ip}`;
  const rl = checkRateLimit(rateLimitKey, { limit: 4, windowMs: 5 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    // Verify user directly from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user || !isAdminRole(user.role)) {
      return NextResponse.json(
        { error: "Administrative record not found in database" },
        { status: 403 }
      );
    }

    const code = generateTwoFactorCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // Save directly in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: code,
        twoFactorExpires: expiresAt,
      },
    });

    const isSmtpConfigured = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );

    // Attempt to transmit via SMTP
    const emailResult = await sendTwoFactorEmail({
      to: user.email,
      adminName: user.name || "Administrator",
      code,
    });

    return NextResponse.json({
      success: true,
      message: isSmtpConfigured
        ? `A 6-digit one-time verification password has been sent to ${user.email}.`
        : `A 6-digit verification code was generated. Configure SMTP credentials in .env to deliver directly to your inbox.`,
      email: user.email,
      smtpConfigured: isSmtpConfigured,
      // If SMTP is not yet configured, provide devCode so the administrator is not locked out in local development
      ...(!isSmtpConfigured ? { devCode: code } : {}),
    });
  } catch (error) {
    console.error("Failed to generate or send 2FA code:", error);
    return NextResponse.json(
      { error: "Failed to generate verification password. Please try again." },
      { status: 500 }
    );
  }
}
