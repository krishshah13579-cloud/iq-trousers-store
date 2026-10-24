import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Cash on Delivery is disabled. All orders must be initiated and paid online via the PayU payment gateway at /api/payment/payu/initiate.",
    },
    { status: 400 }
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email?.toLowerCase().trim();
    let dbUser = null;

    if (userEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
    }

    if (!dbUser && (session.user as { id?: string })?.id) {
      dbUser = await prisma.user.findUnique({
        where: { id: (session.user as { id: string }).id },
        select: { id: true },
      });
    }

    const userId = dbUser?.id || (session.user as { id?: string })?.id;

    if (!userId && !userEmail) {
      return NextResponse.json(
        { error: "User record not found" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(userEmail ? [{ user: { email: { equals: userEmail, mode: "insensitive" as const } } }] : []),
        ],
      },
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
