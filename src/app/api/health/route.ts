import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayUConfig } from "@/lib/payu";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasSmtpHost = Boolean(process.env.SMTP_HOST);
  const hasSmtpUser = Boolean(process.env.SMTP_USER);
  const hasSmtpPass = Boolean(process.env.SMTP_PASS);
  const hasNextAuthSecret = Boolean(process.env.NEXTAUTH_SECRET);
  const payuConfig = getPayUConfig();

  let databaseConnected = false;
  let userCount = 0;
  let dbError = null;

  try {
    const count = await prisma.user.count();
    databaseConnected = true;
    userCount = count;
  } catch (err: any) {
    databaseConnected = false;
    dbError = err?.message || "Unknown database error";
  }

  return NextResponse.json({
    status: databaseConnected ? "healthy" : "degraded",
    database: {
      connected: databaseConnected,
      userCount,
      error: dbError,
    },
    environment: {
      hasDatabaseUrl: hasDbUrl,
      hasSmtpHost,
      hasSmtpUser,
      hasSmtpPass,
      hasNextAuthSecret,
    },
    payu: {
      isConfigured: payuConfig.isConfigured,
      mode: payuConfig.mode,
      gatewayUrl: payuConfig.isConfigured
        ? payuConfig.isLive
          ? "https://secure.payu.in/_payment (LIVE PRODUCTION)"
          : "https://test.payu.in/_payment (TEST GATEWAY)"
        : "Local Sandbox Simulator",
    },
    timestamp: new Date().toISOString(),
  });
}
