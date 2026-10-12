import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, orderTotal } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, message: "Discount code is required" },
        { status: 400 }
      );
    }

    const discountCode = code.trim().toUpperCase();

    const discount = await prisma.discount.findUnique({
      where: { code: discountCode },
    });

    if (!discount) {
      return NextResponse.json(
        { valid: false, message: "Invalid discount code" },
        { status: 404 }
      );
    }

    if (!discount.active) {
      return NextResponse.json(
        { valid: false, message: "This discount code is inactive" },
        { status: 400 }
      );
    }

    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json(
        { valid: false, message: "This discount code has expired" },
        { status: 400 }
      );
    }

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return NextResponse.json(
        { valid: false, message: "This discount code has reached its usage limit" },
        { status: 400 }
      );
    }

    const subtotal = typeof orderTotal === "number" ? orderTotal : parseFloat(orderTotal) || 0;

    if (subtotal < discount.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          message: `Minimum order amount of $${discount.minOrder.toFixed(2)} required for this code`,
        },
        { status: 400 }
      );
    }

    let amount = 0;
    if (discount.type === "PERCENTAGE") {
      amount = (subtotal * discount.value) / 100;
    } else if (discount.type === "FIXED") {
      amount = Math.min(discount.value, subtotal);
    }

    amount = Math.round(amount * 100) / 100;

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        amount,
        minOrder: discount.minOrder,
      },
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
