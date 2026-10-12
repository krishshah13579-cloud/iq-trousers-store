import { prisma } from "@/lib/prisma";
import OrderTable from "./OrderTable";


export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor customer transactions, order status, and fulfillments.
        </p>
      </div>

      <OrderTable initialOrders={orders} />
    </div>
  );
}
