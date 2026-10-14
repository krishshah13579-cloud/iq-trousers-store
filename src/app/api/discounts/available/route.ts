import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserAssociatedDiscount,
  filterDiscountsForUser,
  UserShoppingContext,
} from "@/lib/discounts";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    const { searchParams } = new URL(req.url);
    const cartTotal = parseFloat(searchParams.get("cartTotal") || "0") || 0;

    let userPhone: string | null = null;
    let orderCount = 0;
    let totalSpend = 0;
    let visitCount = 1;
    let userDiscount = null;
    const usedDiscountCodes = new Set<string>();

    // Parse guest visit count from cookie if not logged in
    const cookieHeader = req.headers.get("cookie") || "";
    const guestVisitMatch = cookieHeader.match(/iq_visit_count=(\d+)/);
    if (guestVisitMatch) {
      visitCount = parseInt(guestVisitMatch[1], 10) || 1;
    }

    if (userId) {
      // 1. FOR THE DISCOUNT POSTER & ACCOUNT:
      // "FOR THE DISCOUNT POSTER USE THE DISCOUNT ASSOCIATED TO THAT ACCOUNT DO NOT CREATE ANY NEW COUPONS."
      userDiscount = await getUserAssociatedDiscount(userId);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phone: true,
          firstDiscountCode: true,
          visitCount: true,
        },
      });

      userPhone = user?.phone || null;
      visitCount = (user?.visitCount || 1) + 1;

      // Update visit count asynchronously
      prisma.user
        .update({
          where: { id: userId },
          data: {
            visitCount,
            lastVisitedAt: new Date(),
          },
        })
        .catch(() => {});

      // Calculate past non-cancelled orders & lifetime spend
      const userOrders = await prisma.order.findMany({
        where: {
          userId,
          status: { not: "CANCELLED" },
        },
        select: {
          total: true,
          discountCode: true,
        },
      });

      orderCount = userOrders.length;
      totalSpend = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Track codes already redeemed by this customer
      for (const o of userOrders) {
        if (o.discountCode) {
          usedDiscountCodes.add(o.discountCode.toUpperCase());
        }
      }
    }

    const now = new Date();

    // 2. Fetch personal coupons strictly associated with this user
    let personalCoupons: any[] = [];
    if (userId || userPhone) {
      personalCoupons = await prisma.discount.findMany({
        where: {
          active: true,
          OR: [
            ...(userId ? [{ userId }] : []),
            ...(userPhone ? [{ userPhone }] : []),
          ],
          AND: [
            {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
          ],
        },
      });

      // Filter out coupons user has exceeded max uses on
      personalCoupons = personalCoupons.filter(
        (c) => c.maxUses === null || c.usedCount < c.maxUses
      );
    }

    // 3. Fetch public coupons
    // REQUIREMENT:
    // "ON ADMIN PANEL IN DISCOUNT PAGE THERE MAY BE 5 DISCOUNTS DONT SHOW ALL THE DISCOUNTS AVAILABLE TO USERS.
    // SHOW THEM THE DISCOUNTS BASED ON THEIR USAGES/PURCHASES OR VISITS."
    const rawPublicCoupons = await prisma.discount.findMany({
      where: {
        userId: null,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { minOrder: "asc" },
    });

    // Apply strict usage, purchase history, and visit-based filtering
    const userContext: UserShoppingContext = {
      userId,
      phone: userPhone,
      orderCount,
      totalSpend,
      visitCount,
      usedDiscountCodes,
    };

    const eligiblePublicCoupons = filterDiscountsForUser(
      rawPublicCoupons,
      userContext
    );

    // Combine personal coupons and filtered public coupons
    const combinedCoupons = [...personalCoupons, ...eligiblePublicCoupons];

    // Deduplicate by code
    const seenCodes = new Set<string>();
    const uniqueCoupons = combinedCoupons.filter((c) => {
      const codeUpper = c.code.toUpperCase();
      if (seenCodes.has(codeUpper)) return false;
      seenCodes.add(codeUpper);
      return true;
    });

    // Transform coupons with smart sales-boosting recommendations
    const processedCoupons = uniqueCoupons.map((c) => {
      const isPersonal = Boolean(c.userId || c.userPhone);
      const isFirstOrderCoupon = isPersonal || c.code.startsWith("WELCOME");
      const isEligible = cartTotal >= c.minOrder;
      const shortfall = isEligible
        ? 0
        : Math.round((c.minOrder - cartTotal) * 100) / 100;

      let potentialSavings = 0;
      if (c.type === "PERCENTAGE") {
        potentialSavings = Math.round(((cartTotal * c.value) / 100) * 100) / 100;
      } else {
        potentialSavings = Math.min(c.value, cartTotal);
      }

      if (c.maxDiscount && c.maxDiscount > 0) {
        potentialSavings = Math.min(potentialSavings, c.maxDiscount);
      }

      let daysLeft: number | null = null;
      if (c.expiresAt) {
        const diffMs = new Date(c.expiresAt).getTime() - now.getTime();
        daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      let headline = "";
      let salesPrompt = "";

      if (isFirstOrderCoupon) {
        headline = "10% First Order Welcome Discount";
        salesPrompt = isEligible
          ? "Special welcome offer for your first order!"
          : "Add items to your cart to use your welcome discount!";
      } else if (c.minOrder > 0) {
        const capText =
          c.maxDiscount && c.maxDiscount > 0 ? ` up to ₹${c.maxDiscount}` : "";
        headline = `${
          c.type === "PERCENTAGE" ? `${c.value}% OFF${capText}` : `₹${c.value} OFF`
        } (Orders over ₹${c.minOrder.toFixed(0)})`;
        salesPrompt = isEligible
          ? `You qualify! Save ₹${potentialSavings.toFixed(2)} right now.`
          : `Add ₹${shortfall.toFixed(2)} more to your cart to unlock this deal!`;
      } else {
        const capText =
          c.maxDiscount && c.maxDiscount > 0 ? ` (Up to ₹${c.maxDiscount})` : "";
        headline = `${
          c.type === "PERCENTAGE" ? `${c.value}% OFF${capText}` : `₹${c.value} OFF`
        } Everything`;
        salesPrompt = "Storewide discount applicable immediately!";
      }

      return {
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount,
        minOrder: c.minOrder,
        description: c.description || headline,
        isPersonal,
        isFirstOrderCoupon,
        isEligible,
        shortfall,
        potentialSavings,
        daysLeft,
        salesPrompt,
        badge: isFirstOrderCoupon
          ? "🎉 Personal Offer"
          : c.type === "PERCENTAGE"
          ? `${c.value}% OFF${c.maxDiscount ? ` (Cap ₹${c.maxDiscount})` : ""}`
          : `₹${c.value} OFF`,
      };
    });

    // Sort:
    // 1. Personal / Account-associated coupons first
    // 2. Currently eligible store coupons
    // 3. Upsell coupons
    processedCoupons.sort((a, b) => {
      if (a.isPersonal && !b.isPersonal) return -1;
      if (!a.isPersonal && b.isPersonal) return 1;

      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;

      if (a.isEligible && b.isEligible) {
        return b.potentialSavings - a.potentialSavings;
      }

      return a.shortfall - b.shortfall;
    });

    const response = NextResponse.json({
      success: true,
      cartTotal,
      isLoggedIn: Boolean(userId),
      isFirstOrder: orderCount === 0,
      orderCount,
      totalSpend,
      visitCount,
      userDiscount, // Strictly associated to this account, or null
      coupons: processedCoupons,
    });

    // Increment guest visit count cookie
    if (!userId) {
      response.cookies.set("iq_visit_count", String(visitCount + 1), {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching available discounts:", error);
    return NextResponse.json(
      { success: false, coupons: [] },
      { status: 500 }
    );
  }
}
