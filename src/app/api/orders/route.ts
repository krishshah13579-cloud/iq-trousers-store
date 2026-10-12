import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShippingAddress } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as { id?: string }).id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const body = await req.json();
    const { items, shippingAddress, discountCode } = body as {
      items?: { productId: string; quantity: number }[];
      shippingAddress?: ShippingAddress;
      discountCode?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order items are required" },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const requiredAddressFields: (keyof ShippingAddress)[] = [
      "fullName",
      "address",
      "city",
      "state",
      "zipCode",
      "country",
      "phone",
    ];

    for (const field of requiredAddressFields) {
      if (!shippingAddress[field] || !String(shippingAddress[field]).trim()) {
        return NextResponse.json(
          { error: `Shipping address field '${field}' is required` },
          { status: 400 }
        );
      }
    }

    // Validate quantities
    for (const item of items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid item quantity or product ID" },
          { status: 400 }
        );
      }
    }

    // Fetch products
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products were not found" },
        { status: 404 }
      );
    }

    // Check availability & stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.active) {
        return NextResponse.json(
          { error: `Product "${product?.name || item.productId}" is not available` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${product.name}". Available stock: ${product.stock}`,
          },
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
        if (discount.type === "PERCENTAGE") {
          discountAmount = (roundedSubtotal * discount.value) / 100;
        } else if (discount.type === "FIXED") {
          discountAmount = Math.min(discount.value, roundedSubtotal);
        }
        discountAmount = Math.round(discountAmount * 100) / 100;
        appliedDiscountCode = discount.code;
        discountRecord = discount;
      }
    }

    // Free shipping over $100, else $10 flat rate
    const shipping = roundedSubtotal >= 100 ? 0 : 10;
    const estimatedTax = Math.round(roundedSubtotal * 0.08 * 100) / 100;
    const total = Math.max(
      0,
      Math.round((roundedSubtotal - discountAmount + shipping + estimatedTax) * 100) / 100
    );

    // Create order and decrement product stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock for each item
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Increment discount usage count if applied
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

      // Create order with order items
      return await tx.order.create({
        data: {
          userId,
          total,
          status: "PENDING",
          shippingAddress: JSON.stringify(shippingAddress),
          discountCode: appliedDiscountCode,
          discountAmount,
          items: {
            create: items.map((item: { productId: string; quantity: number; size?: string }) => {
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
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as { id?: string }).id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
