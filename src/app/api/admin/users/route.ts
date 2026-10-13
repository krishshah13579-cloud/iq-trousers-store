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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();

    // Query all regular users (role != ADMIN)
    const users = await prisma.user.findMany({
      where: {
        role: "USER",
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
        orders: {
          select: {
            total: true,
            status: true,
          },
        },
      },
    });

    // Compute spent amount for each user
    const usersWithStats = users.map((u) => {
      const totalSpent = u.orders
        .filter((o) => o.status !== "CANCELLED")
        .reduce((sum, o) => sum + o.total, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        ordersCount: u._count.orders,
        reviewsCount: u._count.reviews,
        totalSpent,
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Failed to fetch registered users:", error);
    return NextResponse.json(
      { error: "Failed to fetch registered users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, role } = body;

    if (!id || !role) {
      return NextResponse.json(
        { error: "User ID and new role are required" },
        { status: 400 }
      );
    }

    if (!["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin accounts cannot be modified" },
        { status: 403 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updated,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safeguard: Super Admin cannot be deleted
    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin accounts cannot be deleted" },
        { status: 403 }
      );
    }

    // Safeguard: Administrator accounts require Super Admin privilege to delete
    if (target.role === "ADMIN") {
      const currentUserRole = (session.user as { role?: string })?.role;
      if (currentUserRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Only Super Admin can delete administrator accounts" },
          { status: 403 }
        );
      }
    }

    // Safeguard: cannot delete yourself
    if (session.user?.email && target.email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Cascade delete related user data
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      // Delete user's order items and orders
      prisma.orderItem.deleteMany({
        where: { order: { userId: id } },
      }),
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
