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

export interface OrderEmailItem {
  name: string;
  quantity: number;
  price: number;
  size?: string | null;
}

export interface SendOrderConfirmationEmailParams {
  to: string;
  orderId: string;
  customerName?: string;
  items: OrderEmailItem[];
  subtotal: number;
  discountAmount?: number;
  discountCode?: string | null;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  orderDate?: Date | string;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Dispatches an order placement confirmation email to the customer with itemized details and receipt.
 */
export async function sendOrderConfirmationEmail({
  to,
  orderId,
  customerName,
  items,
  subtotal,
  discountAmount = 0,
  discountCode,
  shipping,
  tax,
  total,
  shippingAddress,
  orderDate = new Date(),
}: SendOrderConfirmationEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <orders@iqtrousers.com>');

  const displayOrderNum = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
  const subject = `Order Confirmed #${displayOrderNum} — IQ Trousers`;
  const displayName = customerName || shippingAddress.fullName || "Valued Customer";

  const dateStr = new Date(orderDate).toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://iqtrousers.com";
  const orderUrl = `${baseUrl}/orders/${orderId}`;

  const itemsRowsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5;">
          <div style="font-size: 14px; font-weight: 600; color: #18181b;">${item.name}</div>
          <div style="font-size: 12px; color: #71717a; margin-top: 2px;">
            ${item.size ? `<span style="display:inline-block; background:#f4f4f5; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600; color:#3f3f46; margin-right:6px;">Size ${item.size}</span>` : ""}
            Qty: ${item.quantity} × ${formatINR(item.price)}
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #f4f4f5; text-align: right; font-size: 14px; font-weight: 600; color: #18181b; vertical-align: top;">
          ${formatINR(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const discountHtml =
    discountAmount > 0
      ? `
      <tr>
        <td style="padding: 6px 0; font-size: 13px; color: #047857;">
          Discount ${discountCode ? `<span style="background: #ecfdf5; border: 1px dashed #059669; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${discountCode}</span>` : ""}
        </td>
        <td style="padding: 6px 0; text-align: right; font-size: 13px; font-weight: 700; color: #047857;">
          -${formatINR(discountAmount)}
        </td>
      </tr>`
      : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #${displayOrderNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2.5px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px; }
    .badge-bar { background: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 12px 24px; text-align: center; color: #065f46; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
    .intro { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .meta-box { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; font-size: 13px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #71717a; margin-top: 24px; margin-bottom: 12px; }
    .table-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .totals-table { width: 100%; border-collapse: collapse; margin-top: 12px; border-top: 1px solid #e4e4e7; padding-top: 12px; }
    .address-card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; line-height: 1.6; color: #3f3f46; }
    .cancel-policy { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 16px; margin-top: 24px; font-size: 12.5px; line-height: 1.5; color: #92400e; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">KRISH CLOTHING CO. • ORDER CONFIRMATION</div>
    </div>
    <div class="badge-bar">
      ✓ Payment Successful • Order Confirmed & Being Prepared
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}</div>
      <p class="intro">
        Thank you for choosing IQ Trousers. Your order has been placed successfully and is now being tailored and prepped for dispatch. Here is your complete order receipt:
      </p>

      <table style="width: 100%; background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;">
        <tr>
          <td style="font-size: 13px; color: #71717a;">Order ID:</td>
          <td style="font-size: 13px; font-weight: 700; color: #18181b; text-align: right; font-family: monospace;">#${displayOrderNum}</td>
        </tr>
        <tr>
          <td style="font-size: 13px; color: #71717a; padding-top: 4px;">Order Date:</td>
          <td style="font-size: 13px; font-weight: 600; color: #18181b; text-align: right; padding-top: 4px;">${dateStr}</td>
        </tr>
      </table>

      <div class="section-title">Purchased Items</div>
      <table class="table-items">
        ${itemsRowsHtml}
      </table>

      <table class="totals-table">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Subtotal</td>
          <td style="padding: 6px 0; text-align: right; font-size: 13px; font-weight: 600; color: #18181b;">${formatINR(subtotal)}</td>
        </tr>
        ${discountHtml}
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Shipping</td>
          <td style="padding: 6px 0; text-align: right; font-size: 13px; font-weight: 600; color: #18181b;">${shipping === 0 ? "FREE" : formatINR(shipping)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #71717a;">Estimated Tax</td>
          <td style="padding: 6px 0; text-align: right; font-size: 13px; font-weight: 600; color: #18181b;">${formatINR(tax)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 800; color: #18181b; border-top: 1px solid #e4e4e7;">Total Paid</td>
          <td style="padding: 12px 0 0 0; text-align: right; font-size: 18px; font-weight: 800; color: #18181b; border-top: 1px solid #e4e4e7;">${formatINR(total)}</td>
        </tr>
      </table>

      <div class="section-title">Delivery Address</div>
      <div class="address-card">
        <strong>${shippingAddress.fullName}</strong><br>
        ${shippingAddress.address}<br>
        ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
        ${shippingAddress.country}<br>
        <span style="font-size: 12px; color: #71717a;">Phone: ${shippingAddress.phone}</span>
      </div>

      <div class="cancel-policy">
        <strong>⚡ Easy Cancellation Window:</strong> Need to modify or cancel? You can cancel your order directly from your Orders dashboard anytime before it is processed or dispatched. If you used a coupon code, it will be automatically returned to your account for reuse.
      </div>

      <div class="btn-container">
        <a href="${orderUrl}" class="btn">View & Track Order</a>
      </div>
    </div>
    <div class="footer">
      Questions or special fitting requests? Reply directly to this email or visit our Help Center.<br>
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textItems = items
    .map((i) => `- ${i.name}${i.size ? ` (Size: ${i.size})` : ""}: Qty ${i.quantity} x ${formatINR(i.price)} = ${formatINR(i.price * i.quantity)}`)
    .join("\n");

  const textContent = `IQ TROUSERS - ORDER CONFIRMATION
Order #${displayOrderNum}
Date: ${dateStr}
Customer: ${displayName}

Items:
${textItems}

Subtotal: ${formatINR(subtotal)}
${discountAmount > 0 ? `Discount (${discountCode || "Coupon"}): -${formatINR(discountAmount)}\n` : ""}Shipping: ${shipping === 0 ? "FREE" : formatINR(shipping)}
Tax: ${formatINR(tax)}
Total Paid: ${formatINR(total)}

Delivery Address:
${shippingAddress.fullName}
${shippingAddress.address}
${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}
${shippingAddress.country}
Phone: ${shippingAddress.phone}

View your order status online:
${orderUrl}

Need to cancel? You can cancel this order from your dashboard before it is processed. Any applied coupon will be automatically restored.

Thank you for choosing IQ Trousers!`;

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
      console.log(`[ORDER CONFIRMATION EMAIL] Dispatched to ${to} for Order #${displayOrderNum}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[ORDER CONFIRMATION EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[ORDER CONFIRMATION EMAIL DISPATCH]\n` +
    `To: ${to}\n` +
    `Subject: ${subject}\n` +
    `Total: ${formatINR(total)}\n` +
    `Items: ${items.length}\n` +
    `Coupon: ${discountCode || "None"}\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}

export interface SendOrderCancellationEmailParams {
  to: string;
  orderId: string;
  customerName?: string;
  items: OrderEmailItem[];
  total: number;
  restoredDiscountCode?: string | null;
  cancellationDate?: Date | string;
}

/**
 * Dispatches an order cancellation email to the customer, highlighting coupon restoration and restocking.
 */
export async function sendOrderCancellationEmail({
  to,
  orderId,
  customerName,
  items,
  total,
  restoredDiscountCode,
  cancellationDate = new Date(),
}: SendOrderCancellationEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <orders@iqtrousers.com>');

  const displayOrderNum = orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
  const subject = `Order Cancelled #${displayOrderNum} — IQ Trousers`;
  const displayName = customerName || "Valued Customer";

  const dateStr = new Date(cancellationDate).toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const baseUrl = process.env.NEXTAUTH_URL || "https://iqtrousers.com";

  const restoredCouponSection = restoredDiscountCode
    ? `
      <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <div style="font-size: 13px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1px;">
          🎟️ Coupon Restored to Your Account
        </div>
        <div style="margin: 10px 0; font-size: 24px; font-weight: 800; color: #065f46; letter-spacing: 2px; font-family: monospace;">
          ${restoredDiscountCode}
        </div>
        <div style="font-size: 13px; color: #065f46; line-height: 1.5;">
          Your coupon code has been reactivated. You can enter and use it again on your next order at checkout!
        </div>
      </div>`
    : "";

  const itemsHtml =
    items.length > 0
      ? `<div style="margin-top: 12px; border-top: 1px solid #e4e4e7; padding-top: 10px;">
          <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 6px;">Restocked Items:</div>
          ${items
            .map(
              (i) =>
                `<div style="font-size: 13px; color: #3f3f46; margin-bottom: 4px;">• ${i.name}${i.size ? ` (Size ${i.size})` : ""} × ${i.quantity}</div>`
            )
            .join("")}
        </div>`
      : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Cancelled #${displayOrderNum}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2.5px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px; }
    .badge-bar { background: #fef2f2; border-bottom: 1px solid #fecaca; padding: 12px 24px; text-align: center; color: #991b1b; font-size: 13px; font-weight: 600; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
    .intro { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 20px; }
    .info-card { background: #fafafa; border: 1px solid #f4f4f5; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">KRISH CLOTHING CO. • ORDER CANCELLED</div>
    </div>
    <div class="badge-bar">
      ✕ Order #${displayOrderNum} has been Cancelled
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}</div>
      <p class="intro">
        We are confirming that your order <strong>#${displayOrderNum}</strong> has been successfully cancelled on ${dateStr}.
      </p>

      <div class="info-card">
        <div><strong>Order Total Cancelled:</strong> ${formatINR(total)}</div>
        <div style="margin-top: 4px; color: #71717a;">All reserved items have been restocked to our inventory.</div>
        ${itemsHtml}
      </div>

      ${restoredCouponSection}

      <p style="font-size: 13.5px; color: #52525b; line-height: 1.6;">
        We hope to see you again soon. If you need any assistance finding your perfect fit or have questions, feel free to contact us anytime.
      </p>

      <div class="btn-container">
        <a href="${baseUrl}/products" class="btn">Explore Collections</a>
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - ORDER CANCELLED
Order #${displayOrderNum}
Date: ${dateStr}

Hello ${displayName},

Your order #${displayOrderNum} (Total: ${formatINR(total)}) has been successfully cancelled.
${restoredDiscountCode ? `\nCOUPON RESTORED:\nYour coupon code ${restoredDiscountCode} is active and ready to be used on your next order.\n` : ""}
All reserved items have been returned to stock:
${items.map((i) => `- ${i.name}${i.size ? ` (Size: ${i.size})` : ""}: Qty ${i.quantity}`).join("\n")}

Explore new trousers: ${baseUrl}/products

- IQ Trousers Support Team`;

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
      console.log(`[ORDER CANCELLATION EMAIL] Dispatched to ${to} for Order #${displayOrderNum}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[ORDER CANCELLATION EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[ORDER CANCELLATION EMAIL DISPATCH]\n` +
    `To: ${to}\n` +
    `Subject: ${subject}\n` +
    `Restored Coupon: ${restoredDiscountCode || "None"}\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}

export interface SendOrderStatusUpdateEmailParams {
  to: string;
  orderId: string;
  customerName?: string;
  newStatus: string;
  trackingNumber?: string | null;
  items?: OrderEmailItem[];
  total?: number;
}

/**
 * Dispatches an order status progression email to the customer when updated by the admin or courier.
 */
export async function sendOrderStatusUpdateEmail({
  to,
  orderId,
  customerName,
  newStatus,
  trackingNumber,
  items = [],
  total,
}: SendOrderStatusUpdateEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <orders@iqtrousers.com>');

  const displayOrderNum =
    orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
  const displayName = customerName || "Valued Customer";
  const baseUrl = process.env.NEXTAUTH_URL || "https://iqtrousers.com";
  const orderUrl = `${baseUrl}/orders/${orderId}`;

  // Configure status-specific copy, badge, and color
  let statusTitle = "Order Update";
  let statusHeadline = "Status Update for Your Order";
  let statusMessage = "Your order status has been updated.";
  let badgeColor = "#0284c7";
  let badgeBg = "#f0f9ff";

  const normStatus = (newStatus || "").toUpperCase();

  switch (normStatus) {
    case "CONFIRMED":
      statusTitle = "Order Confirmed";
      statusHeadline = "Your Order is Confirmed!";
      statusMessage =
        "We've verified your order and payment. Our team has reserved your items and is preparing them for packaging.";
      badgeColor = "#0284c7";
      badgeBg = "#f0f9ff";
      break;
    case "DISPATCHED":
    case "PROCESSING":
      statusTitle = "Order Dispatched";
      statusHeadline = "Your Package Has Been Dispatched!";
      statusMessage =
        "Your IQ Trousers have been tailored, packed, and handed over to our courier partner for departure.";
      badgeColor = "#4f46e5";
      badgeBg = "#eef2ff";
      break;
    case "IN_TRANSIT":
    case "SHIPPED":
      statusTitle = "Order In Transit";
      statusHeadline = "Your Package is In Transit!";
      statusMessage =
        "Your package is moving smoothly across our logistics network and is heading towards your local delivery facility.";
      badgeColor = "#7c3aed";
      badgeBg = "#f5f3ff";
      break;
    case "OUT_FOR_DELIVERY":
      statusTitle = "Out For Delivery Today";
      statusHeadline = "Your Package is Out For Delivery!";
      statusMessage =
        "The courier delivery agent is on the road with your order and will arrive at your address today. Please keep your phone accessible.";
      badgeColor = "#0d9488";
      badgeBg = "#f0fdfa";
      break;
    case "DELIVERED":
      statusTitle = "Order Delivered";
      statusHeadline = "Your Order Has Been Delivered!";
      statusMessage =
        "Your package was successfully delivered to your doorstep. We hope you enjoy your new IQ Trousers!";
      badgeColor = "#059669";
      badgeBg = "#ecfdf5";
      break;
    default:
      statusTitle = `Order Status: ${newStatus}`;
      statusHeadline = `Your Order is now ${newStatus}`;
      statusMessage = `Your order status has transitioned to ${newStatus}.`;
      break;
  }

  const subject = `${statusTitle} #${displayOrderNum} — IQ Trousers`;

  const trackingHtml = trackingNumber
    ? `
      <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 1px;">
          📦 Courier AWB Tracking Number
        </div>
        <div style="margin: 8px 0; font-size: 18px; font-weight: 800; color: #18181b; letter-spacing: 1.5px; font-family: monospace;">
          ${trackingNumber}
        </div>
        <div style="font-size: 12px; color: #71717a;">
          Live tracking events are synchronized with your order dashboard.
        </div>
      </div>`
    : "";

  const itemsHtml =
    items.length > 0
      ? `
      <div style="margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: #71717a; text-transform: uppercase; margin-bottom: 10px;">
          Items in this shipment:
        </div>
        ${items
          .map(
            (i) => `
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #3f3f46; margin-bottom: 6px;">
            <span>• ${i.name} ${i.size ? `<strong style="color:#18181b;">(Size ${i.size})</strong>` : ""} × ${i.quantity}</span>
            <span style="font-weight: 600; color:#18181b;">${formatINR(i.price * i.quantity)}</span>
          </div>`
          )
          .join("")}
      </div>`
      : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .header { background: #09090b; padding: 32px 24px; text-align: center; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 2.5px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #a1a1aa; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 6px; }
    .badge-bar { background: ${badgeBg}; border-bottom: 1px solid ${badgeColor}33; padding: 12px 24px; text-align: center; color: ${badgeColor}; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
    .intro { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 20px; }
    .headline-box { border-left: 4px solid ${badgeColor}; padding-left: 14px; margin-bottom: 20px; }
    .headline-title { font-size: 16px; font-weight: 700; color: #18181b; }
    .headline-desc { font-size: 13px; color: #71717a; margin-top: 4px; line-height: 1.5; }
    .btn-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background: #09090b; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: 0.3px; }
    .footer { background: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">KRISH CLOTHING CO. • SHIPMENT TRACKING</div>
    </div>
    <div class="badge-bar">
      ● ${statusTitle}
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}</div>
      <p class="intro">
        We have an update regarding your IQ Trousers order <strong>#${displayOrderNum}</strong>:
      </p>

      <div class="headline-box">
        <div class="headline-title">${statusHeadline}</div>
        <div class="headline-desc">${statusMessage}</div>
      </div>

      ${trackingHtml}
      ${itemsHtml}

      ${total ? `<div style="margin-top: 16px; text-align: right; font-size: 14px; font-weight: 700; color: #18181b;">Total Paid: ${formatINR(total)}</div>` : ""}

      <div class="btn-container">
        <a href="${orderUrl}" class="btn">View Live Timeline</a>
      </div>
    </div>
    <div class="footer">
      Track real-time order progression and delivery milestones anytime on your account.<br>
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - ${statusTitle.toUpperCase()}
Order #${displayOrderNum}
Customer: ${displayName}

${statusHeadline}
${statusMessage}

${trackingNumber ? `Tracking / AWB Number: ${trackingNumber}\n` : ""}
Track live order progress online:
${orderUrl}

Thank you for choosing IQ Trousers!`;

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
      console.log(`[ORDER STATUS UPDATE EMAIL] Dispatched to ${to} for Order #${displayOrderNum} [${normStatus}]`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[ORDER STATUS UPDATE EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[ORDER STATUS UPDATE EMAIL DISPATCH]\n` +
    `To: ${to}\n` +
    `Subject: ${subject}\n` +
    `Status: ${newStatus}\n` +
    `Tracking: ${trackingNumber || "None"}\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}

export interface SendExpiredCouponReengagementEmailParams {
  to: string;
  name?: string;
  oldCouponCode?: string;
  newCouponCode: string;
  discountValue: number;
  discountType: "PERCENTAGE" | "FIXED";
  minOrder?: number;
  maxDiscount?: number | null;
  expiresAt: Date;
}

/**
 * Dispatches an automated email campaign to registered customers whose previous welcome coupon expired.
 * Grants a renewed exclusive coupon code to grab attention and increase conversion sales.
 */
export async function sendExpiredCouponReengagementEmail({
  to,
  name,
  oldCouponCode,
  newCouponCode,
  discountValue,
  discountType,
  minOrder = 0,
  maxDiscount,
  expiresAt,
}: SendExpiredCouponReengagementEmailParams): Promise<{ delivered: boolean; info?: string }> {
  const displayName = name || to.split("@")[0] || "Valued Customer";
  const from =
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER
      ? `"IQ Trousers" <${process.env.SMTP_USER}>`
      : '"IQ Trousers" <vip@iqtrousers.com>');

  const discountFormatted =
    discountType === "PERCENTAGE" ? `${discountValue}% OFF` : `₹${discountValue} OFF`;

  const subject = `✨ We Renewed Your Discount: Take ${discountFormatted} — IQ Trousers`;

  const expiryFormatted = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(expiresAt);

  const baseUrl = process.env.NEXTAUTH_URL || "https://iq-trousers-store-uge4.vercel.app";
  const shopUrl = `${baseUrl}/products`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Exclusive Discount Has Been Renewed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
    .header { background: #000000; padding: 36px 32px; text-align: center; border-bottom: 2px solid #e11d48; }
    .logo-text { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 3px; margin: 0; text-transform: uppercase; }
    .sublogo { color: #f43f5e; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; font-weight: 700; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 18px; font-weight: 700; color: #09090b; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .quote-box { background: #fdf2f4; border-left: 4px solid #f43f5e; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 13px; font-style: italic; color: #881337; font-weight: 600; }
    .code-box { background: #fafafa; border: 2px dashed #09090b; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px; position: relative; }
    .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; color: #71717a; margin-bottom: 8px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #e11d48; margin: 0; }
    .badge { display: inline-block; background-color: #fee2e2; color: #991b1b; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 20px; margin-top: 10px; }
    .code-instruction { font-size: 12px; color: #52525b; margin-top: 10px; font-weight: 500; }
    .info-list { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 13px; color: #475569; }
    .info-list p { margin: 6px 0; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background-color: #09090b; color: #ffffff !important; padding: 14px 36px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
    .footer { padding: 24px 32px; background: #fafafa; border-top: 1px solid #f4f4f5; text-align: center; font-size: 11px; color: #a1a1aa; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">IQ TROUSERS</div>
      <div class="sublogo">VIP COURTESY • WELCOME RENEWAL</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${displayName}!</div>
      <p class="message">
        We noticed that your initial registration discount coupon ${oldCouponCode ? `(<code>${oldCouponCode}</code>)` : ""} expired before you had the chance to pick out your perfect pair of trousers.
      </p>

      <div class="quote-box">
        &ldquo;PREMIUM DESIGN SHOULDN&apos;T REQUIRE A PREMIUM MARKUP.&rdquo;
      </div>

      <p class="message">
        We believe everyone deserves impeccably tailored trousers with razor-sharp drape and 360° stretch. To welcome you back, we have renewed your privilege with a brand new account-bound discount:
      </p>
      
      <div class="code-box">
        <div class="code-label">Your Fresh Exclusive Coupon</div>
        <div class="code">${newCouponCode}</div>
        <div class="badge">⏰ Valid for 7 Days • Expires on ${expiryFormatted}</div>
        <div class="code-instruction">
          Enjoy <strong>${discountFormatted}</strong> ${minOrder > 0 ? `on orders over ₹${minOrder.toLocaleString("en-IN")}` : "on your order"}${maxDiscount ? ` (capped up to ₹${maxDiscount.toLocaleString("en-IN")})` : ""}.
        </div>
      </div>

      <div class="info-list">
        <p>🔒 <strong>Account-Bound:</strong> This code is already connected to your registered email account.</p>
        <p>⚡ <strong>Seamless Checkout:</strong> Sign in and your discount will be ready under available offers or applied automatically!</p>
      </div>

      <div class="btn-container">
        <a href="${shopUrl}" class="btn">Explore Trousers &amp; Redeem</a>
      </div>
    </div>
    <div class="footer">
      This special reactivation email was sent to ${to} because your registration discount expired.<br>
      © ${new Date().getFullYear()} IQ Trousers by Krish Clothing Co. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  const textContent = `IQ TROUSERS - YOUR DISCOUNT HAS BEEN RENEWED!
Hello ${displayName},

We noticed your previous coupon ${oldCouponCode ? `(${oldCouponCode}) ` : ""}expired before you had a chance to complete your order.

"PREMIUM DESIGN SHOULDN'T REQUIRE A PREMIUM MARKUP."

Here is your renewed exclusive discount coupon:
>>> ${newCouponCode} <<<
Discount: ${discountFormatted} ${minOrder > 0 ? `(Orders above ₹${minOrder})` : ""}
Valid until: ${expiryFormatted}

This coupon is linked exclusively to your account.
Redeem here: ${shopUrl}

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
      console.log(`[EXPIRED COUPON RE-ENGAGEMENT EMAIL] Sent to ${to} with code ${newCouponCode}`);
      return { delivered: true, info: `Sent via SMTP to ${to}` };
    } catch (err: unknown) {
      console.error("[EXPIRED COUPON RE-ENGAGEMENT EMAIL] SMTP dispatch failed:", err);
    }
  }

  console.log(
    `\n======================================================\n` +
    `[EXPIRED COUPON RE-ENGAGEMENT EMAIL DISPATCH]\n` +
    `To: ${to} (${displayName})\n` +
    `Old Code: ${oldCouponCode || "N/A"} -> New Code: >>> ${newCouponCode} <<<\n` +
    `Discount: ${discountFormatted}\n` +
    `Expires: ${expiryFormatted}\n` +
    `======================================================\n`
  );

  return { delivered: false, info: "Logged to server console" };
}



