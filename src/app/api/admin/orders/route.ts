import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { sendOrderCancellationEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, status, trackingNumber } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required" },
        { status: 400 }
      );
    }

    const ALLOWED_STATUSES = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "DISPATCHED",
      "SHIPPED",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
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

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isCancellingNow = status === "CANCELLED" && existingOrder.status !== "CANCELLED";
    let restoredCouponCode: string | null = null;

    const updated = await prisma.$transaction(async (tx) => {
      if (isCancellingNow) {
        // Restock inventory for each item
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        // Restore applied coupon
        if (existingOrder.discountCode) {
          const discount = await tx.discount.findUnique({
            where: { code: existingOrder.discountCode },
          });

          if (discount) {
            const now = new Date();
            const isExpiringSoon =
              discount.expiresAt &&
              discount.expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
            const newExpiresAt = isExpiringSoon
              ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
              : discount.expiresAt;

            await tx.discount.update({
              where: { id: discount.id },
              data: {
                usedCount: {
                  decrement: 1,
                },
                active: true,
                expiresAt: newExpiresAt,
              },
            });
            restoredCouponCode = discount.code;
          }
        }
      }

      return await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(trackingNumber !== undefined && { trackingNumber }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    // Send cancellation email if order was cancelled
    if (isCancellingNow && existingOrder.user?.email) {
      sendOrderCancellationEmail({
        to: existingOrder.user.email,
        orderId: existingOrder.id,
        customerName: existingOrder.user.name || "Valued Customer",
        items: existingOrder.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.price,
          size: i.size,
        })),
        total: existingOrder.total,
        restoredDiscountCode: restoredCouponCode,
        cancellationDate: new Date(),
      }).catch((emailErr) => {
        console.error("[ADMIN CANCEL EMAIL ERROR]", emailErr);
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    let orderId = searchParams.get("orderId");

    if (!orderId) {
      try {
        const body = await req.json();
        orderId = body?.orderId;
      } catch {
        // body wasn't JSON
      }
    }

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Order ID is required to delete" },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Atomic deletion in transaction:
    // 1. If the order was not already cancelled/delivered, restock products so inventory isn't lost
    // 2. Delete OrderItem records
    // 3. Delete Order
    await prisma.$transaction(async (tx) => {
      if (existingOrder.status !== "CANCELLED" && existingOrder.status !== "DELIVERED") {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      await tx.orderItem.deleteMany({
        where: { orderId: existingOrder.id },
      });

      await tx.order.delete({
        where: { id: existingOrder.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Order #${orderId.slice(-8).toUpperCase()} deleted successfully`,
      orderId,
    });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
