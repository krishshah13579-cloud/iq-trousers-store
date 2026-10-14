import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Automatically purge any coupons that have been used by users
    await prisma.discount.deleteMany({
      where: {
        usedCount: { gt: 0 },
      },
    });

    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Failed to fetch discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      maxUses,
      expiresAt,
      description,
      targetAudience,
      minOrders,
      maxOrders,
      minSpend,
      userId,
      userPhone,
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, type, and value are required" },
        { status: 400 }
      );
    }

    const formattedCode = code.trim().toUpperCase();

    const existing = await prisma.discount.findUnique({
      where: { code: formattedCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A discount code with this name already exists" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data: {
        code: formattedCode,
        type: type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount:
          maxDiscount !== undefined && maxDiscount !== null && String(maxDiscount).trim() !== ""
            ? parseFloat(maxDiscount)
            : null,
        maxUses: maxUses ? parseInt(maxUses, 10) : null,
        expiresAt: expiresAt && String(expiresAt).trim() ? new Date(expiresAt) : null,
        description: description ? String(description).trim() : null,
        targetAudience: targetAudience || "ALL",
        minOrders: minOrders !== undefined && minOrders !== null && String(minOrders).trim() !== "" ? parseInt(minOrders, 10) : 0,
        maxOrders: maxOrders !== undefined && maxOrders !== null && String(maxOrders).trim() !== "" ? parseInt(maxOrders, 10) : null,
        minSpend: minSpend !== undefined && minSpend !== null && String(minSpend).trim() !== "" ? parseFloat(minSpend) : 0,
        userId: userId || null,
        userPhone: userPhone || null,
        active: true,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Failed to create discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
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
    const {
      id,
      active,
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      maxUses,
      expiresAt,
      description,
      targetAudience,
      minOrders,
      maxOrders,
      minSpend,
      userId,
      userPhone,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Discount ID is required" }, { status: 400 });
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        ...(active !== undefined && { active: Boolean(active) }),
        ...(code !== undefined && { code: code.trim().toUpperCase() }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(minOrder !== undefined && { minOrder: parseFloat(minOrder) }),
        ...(maxDiscount !== undefined && {
          maxDiscount:
            maxDiscount !== null && String(maxDiscount).trim() !== ""
              ? parseFloat(maxDiscount)
              : null,
        }),
        ...(maxUses !== undefined && {
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
        }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt && String(expiresAt).trim() ? new Date(expiresAt) : null,
        }),
        ...(description !== undefined && {
          description: description && String(description).trim() ? String(description).trim() : null,
        }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(minOrders !== undefined && {
          minOrders: minOrders !== null && String(minOrders).trim() !== "" ? parseInt(minOrders, 10) : 0,
        }),
        ...(maxOrders !== undefined && {
          maxOrders: maxOrders !== null && String(maxOrders).trim() !== "" ? parseInt(maxOrders, 10) : null,
        }),
        ...(minSpend !== undefined && {
          minSpend: minSpend !== null && String(minSpend).trim() !== "" ? parseFloat(minSpend) : 0,
        }),
        ...(userId !== undefined && { userId: userId || null }),
        ...(userPhone !== undefined && { userPhone: userPhone || null }),
      },
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Failed to update discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
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
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // Body was empty or not JSON
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Discount ID is required" }, { status: 400 });
    }

    await prisma.discount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Discount deleted" });
  } catch (error) {
    console.error("Failed to delete discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}
