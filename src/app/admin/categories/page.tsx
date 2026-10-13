import { prisma } from "@/lib/prisma";
import CategoriesManager from "./CategoriesManager";

export const metadata = {
  title: "Categories Management | IQ Trousers Admin",
};

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // Serialize dates for Client Component
  const serialized = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CategoriesManager initialCategories={serialized} />;
}
