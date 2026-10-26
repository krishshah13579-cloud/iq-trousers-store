import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import BrandValueProps from "@/components/home/BrandValueProps";
import OccasionFitCards from "@/components/home/OccasionFitCards";
import DescriptiveGallerySection from "@/components/home/DescriptiveGallerySection";
import { withDbTimeout } from "@/lib/dbQuery";
import { FALLBACK_CATEGORIES } from "@/lib/fallbackData";

// Enable Incremental Static Regeneration (ISR) with 60-second cache
// Delivers instantaneous sub-50ms TTFB while keeping inventory fresh
export const revalidate = 60;

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
  const query = prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      products: {
        where: { active: true, stock: { gt: 0 } },
        take: 12,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          colors: true,
          stock: true,
          featured: true,
          active: true,
          sizes: true,
          description: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const rawCategories = (await withDbTimeout(query, FALLBACK_CATEGORIES as any, 2000)) as any;
  const baseCategories =
    rawCategories && rawCategories.length > 0 ? rawCategories : FALLBACK_CATEGORIES;
  const categories = baseCategories.map((c: any) => ({
    ...c,
    products: (c.products || []).filter(
      (p: any) => p && (p.stock === undefined || p.stock > 0)
    ),
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Brand Value Props Ribbon */}
      <BrandValueProps />

      {/* 3. Descriptive Category Overview Showroom */}
      <OccasionFitCards />

      {/* 4. Dynamic Descriptive Galleries for Every Category */}
      {categories.map((category: any) => (
        <DescriptiveGallerySection
          key={category.id || category.slug}
          title={category.name}
          slug={category.slug}
          description={category.description}
          products={getCategoryProducts(category.products || [], 8)}
        />
      ))}
    </div>
  );
}
