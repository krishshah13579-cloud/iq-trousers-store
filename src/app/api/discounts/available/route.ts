import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    const { searchParams } = new URL(req.url);
    const cartTotal = parseFloat(searchParams.get("cartTotal") || "0") || 0;

    let userPhone: string | null = null;
    let orderCount = 0;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true },
      });
      userPhone = user?.phone || null;
      orderCount = await prisma.order.count({
        where: { userId, status: { not: "CANCELLED" } },
      });
    }

    const now = new Date();

    // 1. Fetch personal coupons for this user
    let personalCoupons: Array<{
      id: string;
      code: string;
      type: string;
      value: number;
      minOrder: number;
      maxUses: number | null;
      usedCount: number;
      active: boolean;
      expiresAt: Date | null;
      userId: string | null;
      userPhone: string | null;
      description: string | null;
    }> = [];

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
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
              ],
            },
          ],
        },
      });
    }

    // 2. Fetch active public coupons
    const publicCoupons = await prisma.discount.findMany({
      where: {
        userId: null,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { minOrder: "asc" },
    });

    // Combine and deduplicate by code
    const rawCoupons = [...personalCoupons, ...publicCoupons];
    const seenCodes = new Set<string>();
    const uniqueCoupons = rawCoupons.filter((c) => {
      if (seenCodes.has(c.code)) return false;
      seenCodes.add(c.code);
      return true;
    });

    // Filter out coupons that have reached their max usage
    const activeCoupons = uniqueCoupons.filter((c) => {
      if (c.maxUses !== null && c.usedCount >= c.maxUses) return false;
      return true;
    });

    // Transform with smart sales-boosting recommendations
    const processedCoupons = activeCoupons.map((c) => {
      const isPersonal = Boolean(c.userId || c.userPhone);
      const isFirstOrderCoupon = isPersonal || c.code.startsWith("WELCOME");
      const isEligible = cartTotal >= c.minOrder;
      const shortfall = isEligible ? 0 : Math.round((c.minOrder - cartTotal) * 100) / 100;

      let potentialSavings = 0;
      if (c.type === "PERCENTAGE") {
        potentialSavings = Math.round(((cartTotal * c.value) / 100) * 100) / 100;
      } else {
        potentialSavings = Math.min(c.value, cartTotal);
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
        headline = `${c.type === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value} OFF`} (Orders over ₹${c.minOrder.toFixed(0)})`;
        salesPrompt = isEligible
          ? `You qualify! Save ₹${potentialSavings.toFixed(2)} right now.`
          : `Add ₹${shortfall.toFixed(2)} more to your cart to unlock this deal!`;
      } else {
        headline = `${c.type === "PERCENTAGE" ? `${c.value}% OFF` : `₹${c.value} OFF`} Everything`;
        salesPrompt = "Storewide discount applicable immediately!";
      }

      return {
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
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
          ? "🎉 First Order Special"
          : c.type === "PERCENTAGE"
          ? `${c.value}% OFF`
          : `₹${c.value} OFF`,
      };
    });

    // Sort order:
    // 1. Personal / First-order coupons first
    // 2. Currently eligible store coupons (highest savings first)
    // 3. Upsell coupons (lowest shortfall first to maximize upsell conversions)
    processedCoupons.sort((a, b) => {
      if (a.isFirstOrderCoupon && !b.isFirstOrderCoupon) return -1;
      if (!a.isFirstOrderCoupon && b.isFirstOrderCoupon) return 1;

      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;

      if (a.isEligible && b.isEligible) {
        return b.potentialSavings - a.potentialSavings;
      }

      return a.shortfall - b.shortfall;
    });

    return NextResponse.json({
      success: true,
      cartTotal,
      isFirstOrder: orderCount === 0,
      orderCount,
      coupons: processedCoupons,
    });
  } catch (error) {
    console.error("Error fetching available discounts:", error);
    return NextResponse.json(
      { success: false, coupons: [] },
      { status: 500 }
    );
  }
}
