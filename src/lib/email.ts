import nodemailer from "nodemailer";

export interface Send2FAEmailParams {
  to: string;
  userName?: string;
  adminName?: string;
  code: string;
  isAdmin?: boolean;
}

/**
 * Creates and returns an SMTP transporter based on environment variables.
 * If SMTP credentials are not configured, returns null.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const pass =
    rawPass && host?.includes("gmail") ? rawPass.replace(/\s+/g, "") : rawPass;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends the 2FA one-time verification password to the user's or administrator's email.
 */
export async function sendTwoFactorEmail({
  to,
  userName,
  adminName,
  code,
  isAdmin = false,
}: Send2FAEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const displayName = userName || adminName || (isAdmin ? "Administrator" : "Customer");
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers Security" <${process.env.SMTP_USER}>`
      : '"IQ Trousers Security" <security@iqtrousers.com>');

  const subject = isAdmin
    ? `Your IQ Trousers Admin Access Code: ${code}`
    : `Your IQ Trousers Verification Code: ${code}`;

  const sublogo = isAdmin
    ? "KRISH CLOTHING CO. • ADMIN SECURITY"
    : "KRISH CLOTHING CO. • TWO-FACTOR AUTHENTICATION";

  const messageText = isAdmin
    ? "A sign-in attempt was detected for your IQ Trousers Administrator account. Use the one-time verification password below to authenticate your session:"
    : "A sign-in attempt was detected for your IQ Trousers account. Use the one-time verification code below to authenticate and complete your sign-in:";

  const securityNoticeText = isAdmin
    ? "<strong>Security Warning:</strong> If you did not request this login code, someone may have your admin credentials. Please sign in and update your password immediately."
    : "<strong>Security Notice:</strong> If you did not request this login code, someone may have entered your email. Please update your account password immediately to keep your account secure.";

  const footerText = isAdmin
    ? `This is an automated administrative notification sent directly from IQ Trousers Control Center.<br>© ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.`
    : `This is an automated security verification email sent directly from IQ Trousers.<br>© ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>IQ Trousers - Security Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 28px 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 16px; font-weight: 600; color: #18181b; margin-bottom: 8px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 28px; }
    .code-box { background: #fafafa; border: 2px dashed #18181b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #09090b; margin: 0; }
    .expires { font-size: 12px; color: #71717a; margin-top: 8px; }
    .security-notice { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px 16px; font-size: 12px; line-height: 1.5; color: #991b1b; }
    .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">${sublogo}</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}</div>
      <p class="message">
        ${messageText}
      </p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expires">⏱️ This code will expire in 10 minutes</div>
      </div>

      <div class="security-notice">
        ${securityNoticeText}
      </div>
    </div>
    <div class="footer">
      ${footerText}
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - ${isAdmin ? "ADMIN" : "ACCOUNT"} 2FA VERIFICATION
Hello ${displayName},

Your one-time 2FA verification password is:
>>> ${code} <<<

This code is valid for 10 minutes.
If you did not request this code, please secure your account immediately.

- IQ Trousers Security Team`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[2FA EMAIL] Transmitted successfully to ${to}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[2FA EMAIL] SMTP dispatch failed:", err);
      // Fall through to server log
    }
  }

  // If SMTP is not yet configured or failed, log securely to server console
  console.log(
    `\n======================================================\n` +
    `[2FA SECURITY EMAIL DISPATCH]\n` +
    `To: ${to} (${adminName})\n` +
    `Subject: ${subject}\n` +
    `One-Time Password / Code: >>> ${code} <<<\n` +
    `Notice: Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for live inbox transmission.\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console (SMTP not configured in .env)" };
}
