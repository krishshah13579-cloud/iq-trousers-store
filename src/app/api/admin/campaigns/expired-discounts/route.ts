import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendExpiredCouponReengagementEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Fetch all registered customers
    const users = await prisma.user.findMany({
      where: { role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstDiscountCode: true,
        expiredCouponCampaignSentAt: true,
        createdAt: true,
        orders: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, total: true, createdAt: true },
        },
        discounts: {
          select: {
            id: true,
            code: true,
            active: true,
            expiresAt: true,
            usedCount: true,
            maxUses: true,
            type: true,
            value: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const candidates: any[] = [];

    for (const u of users) {
      // Check if user already has an active, usable, unexpired personal discount
      const hasActiveUnexpired = u.discounts.some(
        (d) =>
          d.active &&
          (d.expiresAt === null || d.expiresAt > now) &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );

      // If user currently has a working coupon, they don't need re-engagement
      if (hasActiveUnexpired) {
        continue;
      }

      // Check if user had a coupon that expired without being fully used
      const expiredCoupon = u.discounts.find(
        (d) =>
          d.expiresAt &&
          d.expiresAt <= now &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );

      // Alternatively, check if their initial registration coupon expired
      const hadRegistrationCode = Boolean(u.firstDiscountCode);

      if (expiredCoupon || hadRegistrationCode) {
        candidates.push({
          id: u.id,
          name: u.name || "Customer",
          email: u.email,
          phone: u.phone,
          orderCount: u.orders.length,
          lastCampaignSentAt: u.expiredCouponCampaignSentAt,
          expiredCouponCode: expiredCoupon?.code || u.firstDiscountCode || "WELCOME",
          expiredAt: expiredCoupon?.expiresAt || null,
          isEligible: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalRegistered: users.length,
      eligibleCount: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Failed to fetch expired discount candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch expired discount candidates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      targetUserId,
      discountValue = 10,
      discountType = "PERCENTAGE",
      minOrder = 999,
      maxDiscount = 350,
      validDays = 7,
    } = body;

    const now = new Date();

    // Query candidates
    const userQuery: any = { role: "USER" };
    if (targetUserId) {
      userQuery.id = targetUserId;
    }

    const users = await prisma.user.findMany({
      where: userQuery,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstDiscountCode: true,
        expiredCouponCampaignSentAt: true,
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

    const results: Array<{
      userId: string;
      email: string;
      newCouponCode: string;
      delivered: boolean;
      status: string;
    }> = [];

    for (const user of users) {
      // 1. Double check active unexpired coupon
      const hasActiveUnexpired = user.discounts.some(
        (d) =>
          d.active &&
          (d.expiresAt === null || d.expiresAt > now) &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );

      if (hasActiveUnexpired && !targetUserId) {
        continue;
      }

      // Find expired code for messaging
      const expiredCoupon = user.discounts.find(
        (d) =>
          d.expiresAt &&
          d.expiresAt <= now &&
          (d.maxUses === null || d.usedCount < d.maxUses)
      );
      const oldCode = expiredCoupon?.code || user.firstDiscountCode || undefined;

      // 2. Generate new unique account-bound coupon code
      const shortId = user.id.slice(-4).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newCouponCode = `RENEW10-${shortId}-${randomSuffix}`;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (Number(validDays) || 7));

      // 3. Create fresh account-bound discount record
      const createdDiscount = await prisma.discount.create({
        data: {
          code: newCouponCode,
          type: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
          value: parseFloat(String(discountValue)),
          minOrder: minOrder ? parseFloat(String(minOrder)) : 0,
          maxDiscount: maxDiscount ? parseFloat(String(maxDiscount)) : null,
          maxUses: 1,
          usedCount: 0,
          active: true,
          expiresAt,
          userId: user.id,
          userPhone: user.phone || null,
          targetAudience: "ALL",
          description: `Renewed ${discountValue}% Off privilege for registered customer`,
        },
      });

      // 4. Send the re-engagement email
      const emailResult = await sendExpiredCouponReengagementEmail({
        to: user.email,
        name: user.name || undefined,
        oldCouponCode: oldCode,
        newCouponCode: createdDiscount.code,
        discountValue: createdDiscount.value,
        discountType: createdDiscount.type as "PERCENTAGE" | "FIXED",
        minOrder: createdDiscount.minOrder,
        maxDiscount: createdDiscount.maxDiscount,
        expiresAt: createdDiscount.expiresAt!,
      });

      // 5. Update user timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { expiredCouponCampaignSentAt: new Date() },
      });

      results.push({
        userId: user.id,
        email: user.email,
        newCouponCode: createdDiscount.code,
        delivered: emailResult.delivered,
        status: emailResult.delivered ? "Email Sent" : "Dispatched (Console Logged)",
      });
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    });
  } catch (error) {
    console.error("Failed to run expired discount campaign:", error);
    return NextResponse.json(
      { error: "Failed to run expired discount campaign" },
      { status: 500 }
    );
  }
}
