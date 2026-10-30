import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShippingAddress } from "@/types";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";
import { getPayUConfig, generatePayUHash } from "@/lib/payu";
import { calculateShippingFee } from "@/lib/shipping";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`payu-initiate:${ip}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase().trim();
    let dbUser = null;

    if (userEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true, phone: true },
      });
    }

    if (!dbUser && (session.user as { id?: string })?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: (session.user as { id: string }).id },
        select: { id: true, name: true, email: true, phone: true },
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: "User account not found. Please log in again." }, { status: 401 });
    }

    const userId = dbUser.id;

    const body = await req.json();
    const { items, shippingAddress, discountCode } = body as {
      items?: { productId: string; quantity: number; size?: string }[];
      shippingAddress?: ShippingAddress;
      discountCode?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order items are required" }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }

    // Validate quantities
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json({ error: "Invalid item quantity or product ID" }, { status: 400 });
      }
    }

    // Fetch and validate unique products & stock
    const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueProductIds } },
    });

    if (products.length !== uniqueProductIds.length) {
      return NextResponse.json({ error: "One or more products were not found" }, { status: 404 });
    }

    // Sum requested quantity across variants / duplicate product items
    const quantityPerProduct = items.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    for (const product of products) {
      if (!product.active) {
        return NextResponse.json(
          { error: `Product "${product.name}" is not available` },
          { status: 400 }
        );
      }
      const neededQty = quantityPerProduct[product.id] || 0;
      if (product.stock < neededQty) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${neededQty}` },
          { status: 400 }
        );
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      return sum + prod.price * item.quantity;
    }, 0);

    const roundedSubtotal = Math.round(subtotal * 100) / 100;

    // Apply discount if provided
    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;
    let discountRecord: { id: string; code: string; type: string; value: number } | null = null;

    if (discountCode && typeof discountCode === "string" && discountCode.trim()) {
      const cleanCode = discountCode.trim().toUpperCase();
      const discount = await prisma.discount.findUnique({
        where: { code: cleanCode },
      });

      if (
        discount &&
        discount.active &&
        (!discount.expiresAt || new Date(discount.expiresAt) > new Date()) &&
        (discount.maxUses === null || discount.usedCount < discount.maxUses) &&
        roundedSubtotal >= discount.minOrder
      ) {
        // Enforce user/phone ownership if personal
        if (discount.userId || discount.userPhone) {
          const orderingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, phone: true },
          });
          const userMatches = discount.userId && discount.userId === orderingUser?.id;
          const phoneMatches = discount.userPhone && discount.userPhone === orderingUser?.phone;
          if (!userMatches && !phoneMatches) {
            return NextResponse.json(
              { error: "This coupon is exclusively linked to another customer account." },
              { status: 403 }
            );
          }
        }

        if (discount.type === "PERCENTAGE") {
          discountAmount = (roundedSubtotal * discount.value) / 100;
        } else if (discount.type === "FIXED") {
          discountAmount = Math.min(discount.value, roundedSubtotal);
        }

        // Apply Maximum Discount Limit cap if configured
        if (discount.maxDiscount && discount.maxDiscount > 0) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }

        discountAmount = Math.round(discountAmount * 100) / 100;
        appliedDiscountCode = discount.code;
        discountRecord = discount;
      }
    }

    const shippingQuote = calculateShippingFee(
      roundedSubtotal,
      shippingAddress.state,
      shippingAddress.zipCode,
      dbUser?.email || userEmail
    );
    const shipping = shippingQuote.amount;
    // Estimated tax (5%) rounded off to nearest rupee
    const estimatedTax = Math.round(roundedSubtotal * 0.05);
    // Total with round off amount included (rounded to nearest rupee matching cart & checkout)
    const rawTotal = Math.max(1, roundedSubtotal - discountAmount + shipping + estimatedTax);
    const total = Math.round(rawTotal);

    const txnid = `PAYU_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order and decrement stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock per unique product
      for (const [prodId, totalQty] of Object.entries(quantityPerProduct)) {
        await tx.product.update({
          where: { id: prodId },
          data: {
            stock: {
              decrement: totalQty,
            },
          },
        });
      }

      // Increment discount usedCount
      if (discountRecord) {
        await tx.discount.update({
          where: { id: discountRecord.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      return await tx.order.create({
        data: {
          userId,
          total,
          status: "PENDING",
          paymentIntent: txnid,
          shippingAddress: JSON.stringify(shippingAddress),
          discountCode: appliedDiscountCode,
          discountAmount,
          items: {
            create: items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                quantity: item.quantity,
                size: item.size || null,
                price: product.price,
              };
            }),
          },
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    const config = getPayUConfig();
    const amountStr = total.toFixed(2);
    const productinfo = `IQ Trousers Order #${order.id.slice(-8).toUpperCase()}`;
    const firstname =
      (shippingAddress.fullName || order.user?.name || "Customer").split(" ")[0] || "Customer";
    const email = order.user?.email || session.user?.email || "orders@iqtrousers.com";
    const phone = shippingAddress.phone || "9999999999";

    const originHeader = req.headers.get("origin");
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const protoHeader =
      req.headers.get("x-forwarded-proto") ||
      (hostHeader?.includes("localhost") || hostHeader?.includes("127.0.0.1") ? "http" : "https");
    const dynamicBaseUrl =
      originHeader ||
      (hostHeader ? `${protoHeader}://${hostHeader}` : process.env.NEXTAUTH_URL) ||
      "https://iqtrousers.com";

    const surl = `${dynamicBaseUrl}/api/payment/payu/response`;
    const furl = `${dynamicBaseUrl}/api/payment/payu/response`;

    const hash = generatePayUHash({
      key: config.key,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      salt: config.salt,
      udf1: order.id,
      udf2: userId,
      udf3: appliedDiscountCode || "",
    });

    // If PayU keys are configured, post directly to PayU gateway (test or live).
    // Otherwise, route to our built-in PayU sandbox simulator so testing works seamlessly.
    const action = config.isConfigured ? config.gatewayUrl : "/payu-sandbox";

    return NextResponse.json({
      success: true,
      action,
      orderId: order.id,
      isConfigured: config.isConfigured,
      mode: config.mode,
      params: {
        key: config.key,
        txnid,
        amount: amountStr,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        service_provider: "payu_paisa",
        drop_category: "EMI",
        udf1: order.id,
        udf2: userId,
        udf3: appliedDiscountCode || "",
      },
    });
  } catch (error) {
    console.error("PayU initiate payment error:", error);
    return NextResponse.json({ error: "Failed to initiate PayU payment" }, { status: 500 });
  }
}
