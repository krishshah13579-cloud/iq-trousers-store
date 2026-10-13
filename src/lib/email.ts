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

  if (!user || !pass) {
    return null;
  }

  // Optimized Gmail service transport (fastest & most reliable on Vercel/serverless)
  if (host?.includes("gmail") || user?.includes("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    });
  }

  if (!host) {
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
    connectionTimeout: 6000,
    greetingTimeout: 6000,
    socketTimeout: 6000,
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
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 7 seconds")), 7000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[2FA EMAIL] Transmitted successfully to ${to}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[2FA EMAIL] SMTP dispatch failed or timed out:", err);
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

export interface SendNewsletterEmailParams {
  to: string;
  firstName: string;
  discountCode: string;
}

export async function sendNewsletterWelcomeEmail({
  to,
  firstName,
  discountCode,
}: SendNewsletterEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <hello@iqtrousers.com>');

  const subject = `Your 10% Welcome Discount Code — IQ Trousers`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to IQ Trousers</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .code-box { background: #fafafa; border: 2px dashed #18181b; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #71717a; margin-bottom: 8px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #09090b; margin: 0; }
    .code-instruction { font-size: 12px; color: #71717a; margin-top: 10px; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background-color: #09090b; color: #ffffff !important; padding: 12px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; }
    .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">KRISH CLOTHING CO. • AHMEDABAD</div>
    </div>
    <div class="content">
      <div class="greeting">Welcome to the Club, ${firstName}!</div>
      <p class="message">
        Thank you for subscribing to the IQ Trousers newsletter. As our welcome gift, we are delighted to offer you an exclusive <strong>10% discount</strong> on your order.
      </p>
      
      <div class="code-box">
        <div class="code-label">Your Exclusive Discount Code</div>
        <div class="code">${discountCode}</div>
        <div class="code-instruction">Enter this code at checkout to enjoy 10% off your entire purchase.</div>
      </div>

      <p class="message" style="margin-bottom: 0;">
        Explore our curated everyday casual and formal collections tailored for precision, comfort, and enduring style.
      </p>

      <div class="btn-container">
        <a href="https://iq-trousers-store-uge4.vercel.app/products" class="btn">Explore Products</a>
      </div>
    </div>
    <div class="footer">
      This email was sent to ${to} because you subscribed to updates from IQ Trousers.<br>
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - WELCOME TO OUR NEWSLETTER
Hello ${firstName},

Thank you for subscribing to IQ Trousers! Here is your exclusive 10% welcome discount code:

>>> ${discountCode} <<<

Use this code at checkout to receive 10% off your entire order:
https://iq-trousers-store-uge4.vercel.app/products

- The IQ Trousers Team
Krish Clothing Co.`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 7 seconds")), 7000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[NEWSLETTER EMAIL] Transmitted successfully to ${to}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[NEWSLETTER EMAIL] SMTP dispatch failed or timed out:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[NEWSLETTER WELCOME EMAIL DISPATCH]\n` +
    `To: ${to} (${firstName})\n` +
    `Subject: ${subject}\n` +
    `Discount Code: >>> ${discountCode} <<<\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console (SMTP not configured)" };
}

export interface SendWelcomeRegistrationEmailParams {
  to: string;
  name: string;
  phone: string;
  discountCode: string;
  expiresAt: Date;
}

export async function sendWelcomeRegistrationEmail({
  to,
  name,
  phone,
  discountCode,
  expiresAt,
}: SendWelcomeRegistrationEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <welcome@iqtrousers.com>');

  const subject = `Welcome to IQ Trousers! Your 10% First-Order Coupon: ${discountCode}`;
  const expiryFormatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(expiresAt);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to IQ Trousers</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .code-box { background: #fafafa; border: 2px dashed #18181b; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #71717a; margin-bottom: 8px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #09090b; margin: 0; }
    .code-instruction { font-size: 12px; color: #71717a; margin-top: 10px; }
    .badge { display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 12px; rounded: 9999px; margin-top: 10px; border-radius: 20px; }
    .info-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px; color: #475569; }
    .info-list p { margin: 4px 0; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background-color: #09090b; color: #ffffff !important; padding: 12px 32px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; }
    .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">KRISH CLOTHING CO. • MEMBERSHIP</div>
    </div>
    <div class="content">
      <div class="greeting">Welcome to IQ Trousers, ${name}!</div>
      <p class="message">
        Thank you for joining our community and verifying your mobile number (<strong>${phone}</strong>). As a special welcome gift, here is your exclusive, one-time <strong>10% registration discount coupon</strong>:
      </p>
      
      <div class="code-box">
        <div class="code-label">Your Unique First-Order Coupon</div>
        <div class="code">${discountCode}</div>
        <div class="badge">⏰ Valid for 7 Days • Expires on ${expiryFormatted}</div>
        <div class="code-instruction">Apply this code on the Checkout page to receive 10% off your purchase.</div>
      </div>

      <div class="info-list">
        <p>🔒 <strong>Account Security:</strong> This coupon is linked to your verified phone number (<code>${phone}</code>) and your account email.</p>
        <p>⚡ <strong>One-Click Redeem:</strong> This coupon will also appear automatically in your checkout page under &quot;Available Offers&quot; when you are signed in!</p>
      </div>

      <div class="btn-container">
        <a href="https://iq-trousers-store-uge4.vercel.app/products" class="btn">Shop New Arrivals</a>
      </div>
    </div>
    <div class="footer">
      This welcome email was sent to ${to} upon account registration.<br>
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `WELCOME TO IQ TROUSERS!
Hello ${name},

Thank you for registering your account and verifying your mobile number (${phone}).
Here is your unique 10% first-order discount code:

>>> ${discountCode} <<<

• Valid for: 7 Days (Expires: ${expiryFormatted})
• Usage: 1-time redemption exclusively for your account.

Shop our collections and redeem at checkout:
https://iq-trousers-store-uge4.vercel.app/products

- The IQ Trousers Team
Krish Clothing Co.`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 7 seconds")), 7000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[WELCOME REGISTRATION EMAIL] Sent to ${to}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[WELCOME REGISTRATION EMAIL] SMTP dispatch failed or timed out:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[WELCOME REGISTRATION COUPON DISPATCH]\n` +
    `To: ${to} (${name})\n` +
    `Phone: ${phone}\n` +
    `Unique Coupon: >>> ${discountCode} <<<\n` +
    `Expires: ${expiryFormatted}\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}

export interface SendPhoneVerificationEmailParams {
  to: string;
  phone: string;
  code: string;
}

export async function sendPhoneVerificationEmail({
  to,
  phone,
  code,
}: SendPhoneVerificationEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers Security" <${process.env.SMTP_USER}>`
      : '"IQ Trousers Security" <security@iqtrousers.com>');

  const subject = `Your IQ Trousers Phone Verification Code: ${code}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Phone Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 28px 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .content { padding: 32px; text-align: center; }
    .greeting { font-size: 16px; font-weight: 600; color: #18181b; margin-bottom: 8px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .code-box { background: #fafafa; border: 2px dashed #18181b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #09090b; margin: 0; }
    .expires { font-size: 12px; color: #71717a; margin-top: 8px; }
    .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
    </div>
    <div class="content">
      <div class="greeting">Verify Your Phone Number</div>
      <p class="message">
        You requested a phone verification code for mobile number <strong>${phone}</strong> during registration. Use the one-time code below to verify your phone and claim your 10% welcome coupon:
      </p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expires">⏱️ This verification code is valid for 10 minutes</div>
      </div>
    </div>
    <div class="footer">
      IQ Trousers by Krish Clothing Co.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - PHONE VERIFICATION
Your one-time phone verification code for ${phone} is:
>>> ${code} <<<
Valid for 10 minutes.`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 7 seconds")), 7000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[PHONE VERIFY EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[PHONE VERIFICATION OTP]\n` +
    `Phone: ${phone}\n` +
    `Email: ${to}\n` +
    `Verification Code: >>> ${code} <<<\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}

export interface SendPasswordResetEmailParams {
  to: string;
  name?: string;
  code: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  code,
}: SendPasswordResetEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const displayName = name || "Valued Customer";
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers Security" <${process.env.SMTP_USER}>`
      : '"IQ Trousers Security" <security@iqtrousers.com>');

  const subject = `Your IQ Trousers Password Reset Code: ${code}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #09090b; padding: 28px 32px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px; }
    .content { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 600; color: #18181b; margin-bottom: 8px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .code-box { background: #fafafa; border: 2px dashed #18181b; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #09090b; margin: 0; }
    .expires { font-size: 12px; color: #71717a; margin-top: 8px; }
    .security-notice { background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #991b1b; line-height: 1.5; }
    .footer { padding: 20px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">ACCOUNT SECURITY • PASSWORD RESET</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}</div>
      <p class="message">
        We received a request to reset the password for your IQ Trousers account. Enter the 6-digit verification code below to reset your password:
      </p>
      
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expires">⏱️ This code will expire in 15 minutes</div>
      </div>

      <div class="security-notice">
        <strong>Security Notice:</strong> If you did not make this request, you can safely ignore this email. Your password will remain unchanged.
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - PASSWORD RESET
Hello ${displayName},

Your one-time password reset verification code is:
>>> ${code} <<<

This code is valid for 15 minutes.
If you did not request a password reset, please ignore this email.

- IQ Trousers Security Team`;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SMTP timeout after 7 seconds")), 7000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`[PASSWORD RESET EMAIL] Dispatched to ${to}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[PASSWORD RESET EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[PASSWORD RESET CODE]\n` +
    `To: ${to}\n` +
    `Reset Code: >>> ${code} <<<\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}
