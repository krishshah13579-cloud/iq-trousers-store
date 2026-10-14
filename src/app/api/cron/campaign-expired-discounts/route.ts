import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpiredCouponReengagementEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  return handleCronCampaign(req);
}

export async function POST(req: NextRequest) {
  return handleCronCampaign(req);
}

async function handleCronCampaign(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, check bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const { searchParams } = new URL(req.url);
      if (searchParams.get("key") !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Find users whose welcome/personal coupons expired, who don't have an active coupon,
    // and who haven't received a campaign email within the last 14 days
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        OR: [
          { expiredCouponCampaignSentAt: null },
          { expiredCouponCampaignSentAt: { lt: fourteenDaysAgo } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstDiscountCode: true,
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true },
        },
        discounts: {
          select: {
            id: true,
            code: true,
            active: true,
            expiresAt: true,
            usedCount: true,
            maxUses: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    let sentCount = 0;

    for (const user of users) {
      // 1. Check if user already has an active usable coupon
      const hasActiveUnexpired = user.discounts.some(
        (d) =>
          d.active &&
          (d.expiresAt === null || d.expiresAt > now) &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );

      if (hasActiveUnexpired) {
        continue;
      }

      // 2. Check if they had an expired coupon
      const expiredCoupon = user.discounts.find(
        (d) =>
          d.expiresAt &&
          d.expiresAt <= now &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );

      if (!expiredCoupon && !user.firstDiscountCode) {
        continue;
      }

      const oldCode = expiredCoupon?.code || user.firstDiscountCode || undefined;
      const shortId = user.id.slice(-4).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCouponCode = `RENEW10-${shortId}-${randomSuffix}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Create new account-bound discount
      const createdDiscount = await prisma.discount.create({
        data: {
          code: newCouponCode,
          type: "PERCENTAGE",
          value: 10,
          minOrder: 999,
          maxDiscount: 350,
          maxUses: 1,
          usedCount: 0,
          active: true,
          expiresAt,
          userId: user.id,
          userPhone: user.phone || null,
          targetAudience: "ALL",
          description: "10% Renewal Privilege (Valid for 7 Days)",
        },
      });

      // Send re-engagement email
      await sendExpiredCouponReengagementEmail({
        to: user.email,
        name: user.name || undefined,
        oldCouponCode: oldCode,
        newCouponCode: createdDiscount.code,
        discountValue: createdDiscount.value,
        discountType: "PERCENTAGE",
        minOrder: createdDiscount.minOrder,
        maxDiscount: createdDiscount.maxDiscount,
        expiresAt: createdDiscount.expiresAt!,
      });

      // Mark sent
      await prisma.user.update({
        where: { id: user.id },
        data: { expiredCouponCampaignSentAt: new Date() },
      });

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Automated re-engagement campaign processed. Dispatched ${sentCount} emails.`,
      dispatchedCount: sentCount,
    });
  } catch (error) {
    console.error("Cron campaign execution failed:", error);
    return NextResponse.json(
      { error: "Cron campaign execution failed" },
      { status: 500 }
    );
  }
}
