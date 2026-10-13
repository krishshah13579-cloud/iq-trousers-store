import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderCancellationEmail } from "@/lib/email";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting: Max 15 cancellation requests per 10 minutes per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit(`order-cancel:${ip}`, { limit: 15, windowMs: 10 * 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as { id?: string }).id) {
      return NextResponse.json(
        { error: "Authentication required to cancel order" },
        { status: 401 }
      );
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string })?.role;
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Fetch order with line items and user details
    const order = await prisma.order.findUnique({
      where: { id },
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
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization: User must be order owner or an administrator
    const isOwner = order.userId === userId;
    const isAdmin = isAdminRole(userRole);
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to cancel this order" },
        { status: 403 }
      );
    }

    // Validate if order is already cancelled
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This order has already been cancelled" },
        { status: 400 }
      );
    }

    // Pre-fulfillment validation: Only allow cancellation if order is not yet shipped/delivered
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled because it is already marked as ${order.status.toLowerCase()}. Please contact customer support for returns or changes.`,
        },
        { status: 400 }
      );
    }

    // Perform atomic cancellation:
    // 1. Restock each product in the order
    // 2. Decrement coupon usage and reactivate applied coupon
    // 3. Mark order as CANCELLED
    const result = await prisma.$transaction(async (tx) => {
      // 1. Restock items back into inventory
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // 2. Restore applied discount code so customer can reuse it
      let restoredCouponCode: string | null = null;
      if (order.discountCode) {
        const discount = await tx.discount.findUnique({
          where: { code: order.discountCode },
        });

        if (discount) {
          const now = new Date();
          // If the coupon expired while order was pending or expires within 24 hours, extend by 7 days
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

      // 3. Update order status to CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      });

      return { updatedOrder, restoredCouponCode };
    });

    // 4. Dispatch cancellation confirmation email (awaited to guarantee delivery)
    try {
      const recipientEmail = order.user?.email || session.user?.email;
      if (recipientEmail) {
        await sendOrderCancellationEmail({
          to: recipientEmail,
          orderId: order.id,
          customerName: order.user?.name || "Valued Customer",
          items: order.items.map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.price,
            size: i.size,
          })),
          total: order.total,
          restoredDiscountCode: result.restoredCouponCode,
          cancellationDate: new Date(),
        });
      }
    } catch (emailPrepErr) {
      console.error("[ORDER CANCELLATION EMAIL PREP ERROR]", emailPrepErr);
    }

    const orderShortId = order.id.slice(-8).toUpperCase();
    return NextResponse.json({
      success: true,
      message: result.restoredCouponCode
        ? `Order #${orderShortId} has been successfully cancelled. Your coupon code ${result.restoredCouponCode} has been restored and is active for reuse!`
        : `Order #${orderShortId} has been successfully cancelled. All items have been returned to stock.`,
      orderId: order.id,
      status: "CANCELLED",
      restoredCouponCode: result.restoredCouponCode,
    });
  } catch (error) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order. Please try again." },
      { status: 500 }
    );
  }
}
