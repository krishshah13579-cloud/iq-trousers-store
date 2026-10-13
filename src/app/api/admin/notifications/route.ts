import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch recent orders (last 20)
    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
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
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 2. Fetch recent user registrations (last 10)
    const recentUsers = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    // 3. Fetch low stock products (<= 5)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 5 },
        active: true,
      },
      take: 5,
      orderBy: { stock: "asc" },
      select: {
        id: true,
        name: true,
        stock: true,
        updatedAt: true,
      },
    });

    type NotificationItem = {
      id: string;
      type: "ORDER_PLACED" | "ORDER_CANCELLED" | "USER_REGISTERED" | "LOW_STOCK";
      title: string;
      description: string;
      timestamp: string;
      link: string;
      meta?: Record<string, any>;
    };

    const notifications: NotificationItem[] = [];

    // Map orders
    for (const order of recentOrders) {
      let customerName = order.user?.name || "Customer";
      if (!customerName || customerName.trim() === "") {
        try {
          const parsed = JSON.parse(order.shippingAddress);
          customerName = parsed.fullName || order.user?.email?.split("@")[0] || "Customer";
        } catch {
          customerName = order.user?.email?.split("@")[0] || "Customer";
        }
      }

      const totalFormatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(order.total);

      const shortId = order.id.slice(-8).toUpperCase();
      const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

      if (order.status === "CANCELLED") {
        notifications.push({
          id: `cancel-${order.id}`,
          type: "ORDER_CANCELLED",
          title: `${customerName} cancelled order #${shortId}`,
          description: `Total ${totalFormatted} • All items restocked to inventory`,
          timestamp: order.updatedAt.toISOString(),
          link: `/admin/orders`,
          meta: { orderId: order.id, status: order.status, total: order.total },
        });
      } else {
        notifications.push({
          id: `order-${order.id}`,
          type: "ORDER_PLACED",
          title: `${customerName} placed an order of ${totalFormatted}`,
          description: `Order #${shortId} • ${itemCount} ${itemCount === 1 ? "trouser" : "trousers"} • Status: ${order.status}`,
          timestamp: order.createdAt.toISOString(),
          link: `/admin/orders`,
          meta: { orderId: order.id, status: order.status, total: order.total },
        });
      }
    }

    // Map new registered users
    for (const user of recentUsers) {
      const displayName = user.name || user.email.split("@")[0];
      notifications.push({
        id: `user-${user.id}`,
        type: "USER_REGISTERED",
        title: `New customer registered: ${displayName}`,
        description: `Email: ${user.email}${user.phone ? ` • Phone: ${user.phone}` : ""}`,
        timestamp: user.createdAt.toISOString(),
        link: `/admin/users`,
        meta: { userId: user.id },
      });
    }

    // Map low stock products
    for (const prod of lowStockProducts) {
      notifications.push({
        id: `stock-${prod.id}`,
        type: "LOW_STOCK",
        title: `Low Stock Alert: ${prod.name}`,
        description: `Only ${prod.stock} items remaining in inventory. Consider restocking.`,
        timestamp: prod.updatedAt.toISOString(),
        link: `/admin/products/${prod.id}/edit`,
        meta: { productId: prod.id, stock: prod.stock },
      });
    }

    // Sort chronologically descending
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      notifications: notifications.slice(0, 30),
      totalCount: notifications.length,
      latestOrderId: recentOrders[0]?.id || null,
    });
  } catch (error) {
    console.error("Failed to fetch admin notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
