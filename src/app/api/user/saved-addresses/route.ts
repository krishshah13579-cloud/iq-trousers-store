import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShippingAddress } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email?.toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract past shipping addresses from user orders
    const pastOrders = await prisma.order.findMany({
      where: { userId: user.id },
      select: { shippingAddress: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const addresses: ShippingAddress[] = [];
    const seenSignatures = new Set<string>();

    for (const ord of pastOrders) {
      if (!ord.shippingAddress) continue;
      try {
        const addr: ShippingAddress =
          typeof ord.shippingAddress === "string"
            ? JSON.parse(ord.shippingAddress)
            : ord.shippingAddress;

        if (addr && addr.address && addr.city && addr.zipCode) {
          const signature = `${addr.address.toLowerCase()}_${addr.zipCode}_${(addr.phone || "").replace(/\D/g, "")}`;
          if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            addresses.push({
              fullName: addr.fullName || user.name || "",
              phone: addr.phone || user.phone || "",
              address: addr.address.trim(),
              city: addr.city.trim(),
              state: addr.state.trim(),
              zipCode: addr.zipCode.trim(),
              country: addr.country?.trim() || "India",
            });
          }
        }
      } catch {}
    }

    return NextResponse.json({
      user: {
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      },
      addresses,
    });
  } catch (error: any) {
    console.error("Failed to fetch saved addresses:", error);
    return NextResponse.json(
      { error: "Failed to load saved addresses: " + error.message },
      { status: 500 }
    );
  }
}
