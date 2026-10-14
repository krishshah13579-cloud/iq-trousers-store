import { prisma } from "@/lib/prisma";

export interface UserDiscountReward {
  orderCount: number;
  totalSpend: number;
  tier: "WELCOME" | "REPEAT" | "LOYAL" | "VIP";
  discount: {
    id: string;
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minOrder: number;
    maxDiscount: number | null;
    description: string;
  };
}

/**
 * Evaluates a user's purchase history and usage to dynamically grant or return
 * the appropriate account-bound discount coupon.
 *
 * Tier 1: 0 purchases -> 10% Welcome Discount (WELCOME10-XXXX)
 * Tier 2: 1 purchase completed -> ₹200 Off 2nd Purchase Reward (REPEAT200-XXXX)
 * Tier 3: 2-4 purchases or ₹4,000+ spend -> 15% Loyalty Privilege (LOYAL15-XXXX)
 * Tier 4: 5+ purchases or ₹8,000+ spend -> 25% VIP Privilege (VIP25-XXXX)
 */
export async function getOrCreateUserPurchaseDiscount(
  userId: string
): Promise<UserDiscountReward | null> {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!user) return null;

    // 1. Calculate user purchase history (exclude cancelled orders)
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        total: true,
        discountCode: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const orderCount = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + (o.total || 0), 0);

    // 2. Determine reward tier based on purchases and usage
    let tierName: "WELCOME" | "REPEAT" | "LOYAL" | "VIP" = "WELCOME";
    let tierConfig: {
      prefix: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      minOrder: number;
      maxDiscount: number | null;
      description: string;
    } = {
      prefix: "WELCOME10",
      type: "PERCENTAGE",
      value: 10,
      minOrder: 999,
      maxDiscount: 350,
      description: "10% Welcome Discount on your first purchase",
    };

    if (orderCount === 1) {
      tierName = "REPEAT";
      tierConfig = {
        prefix: "REPEAT200",
        type: "FIXED" as const,
        value: 200,
        minOrder: 1799,
        maxDiscount: null,
        description: "₹200 Off Second Purchase Privilege",
      };
    } else if (orderCount >= 2 && orderCount < 5 && totalSpend < 8000) {
      tierName = "LOYAL";
      tierConfig = {
        prefix: "LOYAL15",
        type: "PERCENTAGE" as const,
        value: 15,
        minOrder: 2199,
        maxDiscount: 600,
        description: "15% Loyalty Reward based on your purchase history",
      };
    } else if (orderCount >= 5 || totalSpend >= 8000) {
      tierName = "VIP";
      tierConfig = {
        prefix: "VIP25",
        type: "PERCENTAGE" as const,
        value: 25,
        minOrder: 2499,
        maxDiscount: 1000,
        description: "25% VIP Privilege for top patrons",
      };
    }

    const now = new Date();

    // 3. Check existing active personal discounts exclusively linked to this user's account
    const existingPersonal = await prisma.discount.findMany({
      where: {
        userId,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Check for an unused coupon (maxUses === null or usedCount < maxUses)
    const usable = existingPersonal.find(
      (d) => d.maxUses === null || d.usedCount < d.maxUses
    );

    if (usable) {
      return {
        orderCount,
        totalSpend,
        tier: tierName,
        discount: {
          id: usable.id,
          code: usable.code,
          type: usable.type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
          value: Number(usable.value),
          minOrder: Number(usable.minOrder || 0),
          maxDiscount: usable.maxDiscount ? Number(usable.maxDiscount) : null,
          description: usable.description || tierConfig.description,
        },
      };
    }

    // 4. If user has used their previous coupon or has no active coupon, generate the new tier coupon
    const shortId = userId.slice(-4).toUpperCase();
    const candidateCode = `${tierConfig.prefix}-${shortId}${orderCount > 0 ? `-${orderCount}` : ""}`;

    let uniqueCode = candidateCode;
    const existingCode = await prisma.discount.findUnique({
      where: { code: uniqueCode },
    });

    if (existingCode) {
      uniqueCode = `${tierConfig.prefix}-${shortId}-${Date.now().toString().slice(-4)}`;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 45); // 45 days validity

    const newDiscount = await prisma.discount.create({
      data: {
        code: uniqueCode,
        type: tierConfig.type,
        value: tierConfig.value,
        minOrder: tierConfig.minOrder,
        maxDiscount: tierConfig.maxDiscount,
        maxUses: 1,
        usedCount: 0,
        active: true,
        expiresAt,
        userId,
        userPhone: user.phone || null,
        description: tierConfig.description,
      },
    });

    return {
      orderCount,
      totalSpend,
      tier: tierName,
      discount: {
        id: newDiscount.id,
        code: newDiscount.code,
        type: newDiscount.type as "PERCENTAGE" | "FIXED",
        value: Number(newDiscount.value),
        minOrder: Number(newDiscount.minOrder),
        maxDiscount: newDiscount.maxDiscount ? Number(newDiscount.maxDiscount) : null,
        description: newDiscount.description || tierConfig.description,
      },
    };
  } catch (err) {
    console.error("Error evaluating user purchase discount reward:", err);
    return null;
  }
}
