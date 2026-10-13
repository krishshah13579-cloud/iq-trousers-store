import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserRole = (session.user as { role?: string })?.role;
  if (currentUserRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can create new administrators" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name?.trim() || "";

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      // If user already exists, check if they are already an admin
      if (isAdminRole(existing.role)) {
        return NextResponse.json(
          { error: "An administrator with this email already exists" },
          { status: 400 }
        );
      } else {
        // Upgrade existing user to admin
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: "ADMIN",
            ...(trimmedName && { name: trimmedName }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });
        return NextResponse.json(
          {
            message: "Existing customer account upgraded to Administrator",
            admin: updated,
          },
          { status: 200 }
        );
      }
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        name: trimmedName || trimmedEmail.split("@")[0],
        email: trimmedEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Administrator account created successfully",
        admin: newAdmin,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create admin:", error);
    return NextResponse.json(
      { error: "Failed to create administrator account" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserRole = (session.user as { role?: string })?.role;
  if (currentUserRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can modify administrator roles" },
      { status: 403 }
    );
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
        { error: "Invalid role specified. Permitted roles: USER, ADMIN" },
        { status: 400 }
      );
    }

    // Check target user
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin privileges cannot be modified" },
        { status: 400 }
      );
    }

    // Safeguard: Cannot demote yourself
    if (session.user?.email && target.email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot demote your own administrator account" },
        { status: 400 }
      );
    }

    // Safeguard: Cannot demote the last admin
    if (role === "USER") {
      const adminCount = await prisma.user.count({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only remaining Administrator" },
          { status: 400 }
        );
      }
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
      message: `Administrator demoted to customer`,
    });
  } catch (error) {
    console.error("Failed to update admin role:", error);
    return NextResponse.json(
      { error: "Failed to update administrator role" },
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
    const { id, newPassword } = body;

    if (!id || !newPassword) {
      return NextResponse.json(
        { error: "Admin ID and new password are required" },
        { status: 400 }
      );
    }

    const trimmedPassword = String(newPassword).trim();
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target || !isAdminRole(target.role)) {
      return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
    }

    // Only allow updating if you are SUPER_ADMIN or updating your own account
    const currentUserRole = (session.user as { role?: string })?.role;
    const currentUserId = (session.user as { id?: string })?.id;
    if (currentUserRole !== "SUPER_ADMIN" && currentUserId !== id) {
      return NextResponse.json(
        { error: "Only Super Admin can update another administrator's password" },
        { status: 403 }
      );
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for ${target.email}`,
    });
  } catch (error) {
    console.error("Failed to update admin password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserRole = (session.user as { role?: string })?.role;
  if (currentUserRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can delete administrator accounts" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin account cannot be deleted" },
        { status: 400 }
      );
    }

    // Safeguard: Cannot delete yourself
    if (session.user?.email && target.email === session.user.email) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account" },
        { status: 400 }
      );
    }

    // Safeguard: Cannot delete last admin
    const adminCount = await prisma.user.count({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only remaining Administrator" },
        { status: 400 }
      );
    }

    // Cascade delete
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { userId: id } }),
      prisma.review.deleteMany({ where: { userId: id } }),
      prisma.orderItem.deleteMany({
        where: { order: { userId: id } },
      }),
      prisma.order.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Administrator deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete admin:", error);
    return NextResponse.json(
      { error: "Failed to delete administrator account" },
      { status: 500 }
    );
  }
}
