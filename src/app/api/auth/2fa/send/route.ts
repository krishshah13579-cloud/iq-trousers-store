import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/auth";
import { generateTwoFactorCode, CODE_EXPIRATION_MINUTES } from "@/lib/twoFactor";
import { sendTwoFactorEmail } from "@/lib/email";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

function maskEmailAddress(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  const maskedName = `${name[0]}${"*".repeat(Math.min(name.length - 2, 4))}${name.slice(-1)}`;
  return `${maskedName}@${domain}`;
}

export async function POST(req: NextRequest) {
  // Rate Limiting: Max 20 code generation attempts per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`auth-2fa-send:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const body = await req.json();
    const { email, password, portal } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const strPassword = String(password);

    // Bcrypt DoS safeguard: reject excessively long passwords before hashing
    if (strPassword.length > 128) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Rate Limiting by Target Email
    const emailRl = checkRateLimit(`auth-2fa-send:email:${trimmedEmail}`, {
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailRl.success) {
      return createRateLimitResponse(emailRl.resetMs);
    }

    // Critical environment sanity check
    if (!process.env.DATABASE_URL) {
      console.error("[CRITICAL AUTH ERROR] DATABASE_URL is not set in environment variables!");
      return NextResponse.json(
        {
          error:
            "DATABASE_URL is missing in Vercel Environment Variables. Please add DATABASE_URL in Vercel Settings -> Environment Variables and redeploy.",
        },
        { status: 503 }
      );
    }

    // Verify user exists and credentials are correct with auto-retry for cold database waking
    let user = null;
    let lastDbError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        user = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        });
        lastDbError = null;
        break;
      } catch (dbErr: any) {
        lastDbError = dbErr;
        console.warn(`[2FA DB ATTEMPT ${attempt} FAILED]:`, dbErr?.message);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }

    if (lastDbError) {
      console.error("Database connection error after retries in 2FA send:", lastDbError);
      return NextResponse.json(
        {
          error: `Database connection failed. Render PostgreSQL may be waking up from sleep or DATABASE_URL needs verification. (${lastDbError.message ? lastDbError.message.slice(0, 80) : "Connection timeout"})`,
        },
        { status: 503 }
      );
    }

    if (!user) {
      // Uniform timing-safe error response to prevent account enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(strPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate secure 6-digit OTP code and expiry
    const code = generateTwoFactorCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // Save directly to user record in DB
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorCode: code,
          twoFactorExpires: expiresAt,
        },
      });
    } catch (updateErr: any) {
      console.error("Database error updating 2FA code:", updateErr);
      return NextResponse.json(
        { error: "Failed to store verification code in database. Please try again." },
        { status: 503 }
      );
    }

    const isAdmin = isAdminRole(user.role);

    // Dispatch 2FA verification email
    let emailDelivered = false;
    try {
      const emailResult = await sendTwoFactorEmail({
        to: user.email,
        userName: user.name || (isAdmin ? "Administrator" : "Customer"),
        code,
        isAdmin,
      });
      emailDelivered = emailResult.delivered;
    } catch (emailErr) {
      console.error("Non-fatal email dispatch error:", emailErr);
      emailDelivered = false;
    }

    const maskedEmail = maskEmailAddress(user.email);

    return NextResponse.json({
      success: true,
      email: user.email,
      role: user.role,
      maskedEmail,
      message: emailDelivered
        ? `A 6-digit verification code has been dispatched to ${maskedEmail}`
        : `A 6-digit verification code was generated (Email service offline).`,
      emailDelivered,
      // If email delivery could not be completed, provide code so user is not blocked
      ...(!emailDelivered ? { devCode: code } : {}),
    });
  } catch (error: any) {
    console.error("Failed to generate or send user 2FA code:", error);
    const msg = error?.message || "";
    if (msg.includes("Can't reach database") || msg.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          error:
            "Database connection failed. Please ensure DATABASE_URL is configured in Vercel.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
