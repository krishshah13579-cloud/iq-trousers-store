import crypto from "crypto";

export const TWO_FACTOR_COOKIE = "admin_2fa_verified";
export const CODE_EXPIRATION_MINUTES = 10;

const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL SECURITY: NEXTAUTH_SECRET must be configured in production.");
  }
  return secret || "iq-trousers-admin-2fa-super-secret-key-2026";
};

/**
 * Generate a cryptographically secure 6-digit numerical code
 */
export function generateTwoFactorCode(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Create an HMAC-SHA256 signed 2FA token
 */
export function createTwoFactorToken(userId: string): string {
  const timestamp = Date.now().toString();
  const secret = getSecret();
  const payload = `${userId}:${timestamp}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

/**
 * Verify the HMAC-SHA256 signed 2FA token
 */
export function verifyTwoFactorToken(
  token: string | undefined | null,
  userId: string,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // default 7 days
): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [tokenUserId, timestampStr, signature] = parts;

  if (tokenUserId !== userId) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check token expiration
  if (Date.now() - timestamp > maxAgeMs) return false;

  const secret = getSecret();
  const payload = `${tokenUserId}:${timestampStr}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
