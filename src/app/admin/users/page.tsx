import { prisma } from "@/lib/prisma";
import RegisteredUsersManager from "./RegisteredUsersManager";

export const metadata = {
  title: "Registered Users | IQ Trousers Admin",
};

export const revalidate = 0;

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: {
      role: "USER",
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

  const serialized = users.map((u) => {
    const totalSpent = u.orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + o.total, 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      ordersCount: u._count.orders,
      reviewsCount: u._count.reviews,
      totalSpent,
    };
  });

  return <RegisteredUsersManager initialUsers={serialized} />;
}
