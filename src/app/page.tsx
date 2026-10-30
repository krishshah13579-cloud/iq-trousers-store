import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import BrandValueProps from "@/components/home/BrandValueProps";
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
  const categoriesQuery = prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
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

  const allActiveQuery = prisma.product.findMany({
    where: { active: true, stock: { gt: 0 } },
    take: 36,
    orderBy: { createdAt: "desc" },
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
  });

  const [rawCategories, rawAllActive] = await Promise.all([
    withDbTimeout(categoriesQuery, FALLBACK_CATEGORIES as any, 3000) as any,
    withDbTimeout(allActiveQuery, [] as any, 3000) as any,
  ]);

  const baseCategories =
    rawCategories && rawCategories.length > 0 ? rawCategories : FALLBACK_CATEGORIES;
  const categories = baseCategories.map((c: any) => ({
    ...c,
    products: (c.products || []).filter(
      (p: any) => p && (p.stock === undefined || p.stock > 0)
    ),
  }));

  // Flatten active products from DB or fallback categories
  const allProducts: any[] =
    rawAllActive && rawAllActive.length > 0
      ? rawAllActive
      : categories.flatMap((c: any) => c.products || []);

  // 1. New Arrivals: 8 newest products
  const newArrivals = allProducts.slice(0, 8);

  // 2. Deals: Products with >= 35% discount (or any discount if < 4 items)
  const highDiscounts = allProducts.filter(
    (p: any) =>
      p.comparePrice &&
      p.comparePrice > p.price &&
      (p.comparePrice - p.price) / p.comparePrice >= 0.35
  );
  const generalDiscounts = allProducts.filter(
    (p: any) => p.comparePrice && p.comparePrice > p.price
  );
  const deals = (highDiscounts.length >= 4 ? highDiscounts : generalDiscounts).slice(0, 8);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Brand Value Props Ribbon */}
      <BrandValueProps />

      {/* 3. New Arrivals Header & Gallery */}
      {newArrivals.length > 0 && (
        <DescriptiveGallerySection
          title="New Arrivals"
          slug="new-arrivals"
          customHref="/products?tab=new-arrivals"
          products={newArrivals}
        />
      )}

      {/* 4. Deals Header & Gallery (≥35% OFF) */}
      {deals.length > 0 && (
        <DescriptiveGallerySection
          title="Deals & Offers"
          slug="deals"
          customHref="/products?tab=discounts"
          products={deals}
        />
      )}

      {/* 5. Dynamic Galleries for Every Category */}
      {categories.map((category: any) => (
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
