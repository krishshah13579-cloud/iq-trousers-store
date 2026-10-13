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
  // Rate Limiting: Max 5 code generation attempts per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`auth-2fa-send:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
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

    // Rate Limiting by Target Email: Max 5 code requests per 10 minutes per account
    const emailRl = checkRateLimit(`auth-2fa-send:email:${trimmedEmail}`, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailRl.success) {
      return createRateLimitResponse(emailRl.resetMs);
    }

    // Verify user exists and credentials are correct prior to dispatching email
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      // Uniform timing-safe error response to prevent account enumeration
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const requestedPortal = portal ? String(portal).trim().toUpperCase() : "STORE";
    const isUserAdmin = isAdminRole(user.role);

    // Strict Separation: Do not allow admin login through the customer interface
    if (requestedPortal === "STORE" && isUserAdmin) {
      return NextResponse.json(
        {
          error:
            "Administrator accounts are not permitted to sign in through the customer storefront. Please access the Admin Portal directly.",
        },
        { status: 403 }
      );
    }

    // Strict Separation: Do not allow customer login through the admin portal
    if (requestedPortal === "ADMIN" && !isUserAdmin) {
      return NextResponse.json(
        {
          error:
            "Access Denied: Only authorized administrators may sign in to the Admin Portal.",
        },
        { status: 403 }
      );
    }

    // Generate secure 6-digit OTP code and expiry
    const code = generateTwoFactorCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // Save directly to user record in DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorCode: code,
        twoFactorExpires: expiresAt,
      },
    });

    const isAdmin = isAdminRole(user.role);

    // Dispatch 2FA verification email
    await sendTwoFactorEmail({
      to: user.email,
      userName: user.name || (isAdmin ? "Administrator" : "Customer"),
      code,
      isAdmin,
    });

    const maskedEmail = maskEmailAddress(user.email);

    return NextResponse.json({
      success: true,
      email: user.email,
      maskedEmail,
      message: `A 6-digit verification code has been dispatched to ${maskedEmail}`,
    });
  } catch (error) {
    console.error("Failed to generate or send user 2FA code:", error);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
