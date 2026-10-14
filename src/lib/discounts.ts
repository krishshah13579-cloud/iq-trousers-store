import { prisma } from "@/lib/prisma";

export interface UserAccountDiscount {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  description: string;
  expiresAt: Date | null;
}

export interface UserShoppingContext {
  userId?: string | null;
  phone?: string | null;
  orderCount: number;
  totalSpend: number;
  visitCount: number;
  usedDiscountCodes: Set<string>;
}

/**
 * STRICT REQUIREMENT:
 * "FOR THE DISCOUNT POSTER USE THE DISCOUNT ASSOCIATED TO THAT ACCOUNT DO NOT CREATE ANY NEW COUPONS."
 *
 * Fetches the active, non-expired, usable discount associated with this specific user account.
 * DO NOT create any new coupons in the database.
 */
export async function getUserAssociatedDiscount(
  userId: string
): Promise<UserAccountDiscount | null> {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        firstDiscountCode: true,
      },
    });

    if (!user) return null;

    const now = new Date();

    // Query active discounts associated with this account (by userId, userPhone, or firstDiscountCode)
    const orConditions: any[] = [{ userId: user.id }];
    if (user.phone) {
      orConditions.push({ userPhone: user.phone });
    }
    if (user.firstDiscountCode) {
      orConditions.push({ code: user.firstDiscountCode });
    }

    const personalDiscounts = await prisma.discount.findMany({
      where: {
        active: true,
        OR: orConditions,
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Pick the first discount that is still usable (not exceeded maxUses)
    const usableDiscount = personalDiscounts.find(
      (d) => d.maxUses === null || d.usedCount < d.maxUses
    );

    if (!usableDiscount) {
      // User has no active unexpired coupon associated with their account.
      // Strict rule: DO NOT create any new coupon!
      return null;
    }

    return {
      id: usableDiscount.id,
      code: usableDiscount.code,
      type: usableDiscount.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
      value: Number(usableDiscount.value),
      minOrder: Number(usableDiscount.minOrder || 0),
      maxDiscount: usableDiscount.maxDiscount ? Number(usableDiscount.maxDiscount) : null,
      description: usableDiscount.description || `${usableDiscount.type === "PERCENTAGE" ? `${usableDiscount.value}%` : `₹${usableDiscount.value}`} OFF exclusive discount for your account`,
      expiresAt: usableDiscount.expiresAt,
    };
  } catch (error) {
    console.error("Error fetching user associated discount:", error);
    return null;
  }
}

/**
 * Filter public discounts based on user usage, purchases, and visits.
 * "ON ADMIN PANEL IN DISCOUNT PAGE THERE MAY BE 5 DISCOUNTS DONT SHOW ALL THE DISCOUNTS AVAILABLE TO USERS.
 * SHOW THEM THE DISCOUNTS BASED ON THEIR USAGES/PURCHASES OR VISITS."
 */
export function filterDiscountsForUser(
  discounts: any[],
  context: UserShoppingContext
): any[] {
  const { orderCount, totalSpend, visitCount, usedDiscountCodes } = context;

  return discounts.filter((d) => {
    // 1. Check max uses
    if (d.maxUses !== null && d.usedCount >= d.maxUses) {
      return false;
    }

    // 2. Check if user has already redeemed this specific coupon in a past order
    if (usedDiscountCodes.has(d.code.toUpperCase())) {
      return false;
    }

    // 3. Evaluate Target Audience & Purchase Count
    const audience = d.targetAudience || "ALL";

    // First purchase only
    if (
      audience === "FIRST_PURCHASE" ||
      d.code.startsWith("WELCOME") ||
      (d.description && d.description.toLowerCase().includes("first order"))
    ) {
      if (orderCount > 0) {
        return false; // User already made a purchase, do not show first purchase discounts
      }
    }

    // Repeat buyers only
    if (audience === "REPEAT_BUYER" || d.code.startsWith("REPEAT")) {
      if (orderCount < 1) {
        return false; // User hasn't made a first purchase yet
      }
    }

    // Loyal / VIP Patrons only
    if (
      audience === "LOYAL_VIP" ||
      d.code.startsWith("VIP") ||
      d.code.startsWith("LOYAL") ||
      (d.minOrder && d.minOrder >= 4000)
    ) {
      // High tier discounts only shown to users with 2+ orders or ₹4,000+ spend
      if (orderCount < 2 && totalSpend < 4000) {
        return false;
      }
    }

    // Returning visitors only
    if (audience === "RETURNING_VISITOR") {
      if (visitCount < 2) {
        return false; // Needs at least 2 visits
      }
    }

    // Custom order count limits if defined by admin
    if (d.minOrders !== null && d.minOrders !== undefined && d.minOrders > 0) {
      if (orderCount < d.minOrders) return false;
    }

    if (d.maxOrders !== null && d.maxOrders !== undefined) {
      if (orderCount > d.maxOrders) return false;
    }

    // Custom spend limits if defined by admin
    if (d.minSpend !== null && d.minSpend !== undefined && d.minSpend > 0) {
      if (totalSpend < d.minSpend) return false;
    }

    return true;
  });
}
