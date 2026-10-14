import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import BrandValueProps from "@/components/home/BrandValueProps";
import DescriptiveGallerySection from "@/components/home/DescriptiveGallerySection";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Ensure fresh product data

function getCategoryProducts<T>(items: T[], max = 8): T[] {
  if (!items || items.length === 0) return [];
  // If products are more than 8, keep it random
  if (items.length > max) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, max);
  }
  // If products are less than or equal to 8, don't randomise
  return items.slice(0, max);
}

export default async function HomePage() {
  let categories: any[] = [];

  try {
    categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        products: {
          where: { active: true },
          include: {
            category: true,
            reviews: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to query categories on HomePage:", error);
    categories = [];
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Brand Value Props Ribbon */}
      <BrandValueProps />

      {/* 3. Dynamic Descriptive Galleries for Every Category */}
      {categories.map((category) => (
        <DescriptiveGallerySection
          key={category.id || category.slug}
          title={category.name}
          slug={category.slug}
          products={getCategoryProducts(category.products || [], 8)}
        />
      ))}
    </div>
  );
}
