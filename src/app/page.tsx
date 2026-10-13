import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import BrandValueProps from "@/components/home/BrandValueProps";
import DescriptiveGallerySection from "@/components/home/DescriptiveGallerySection";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Ensure fresh product data

export default async function HomePage() {
  let casualCategory = null;
  let formalCategory = null;

  try {
    const results = await Promise.all([
      prisma.category.findFirst({
        where: {
          OR: [{ slug: "everyday-casual" }, { slug: "casual-everyday" }],
        },
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
      }),
      prisma.category.findFirst({
        where: {
          OR: [{ slug: "formal-wear" }, { slug: "formal" }],
        },
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
      }),
    ]);
    casualCategory = results[0];
    formalCategory = results[1];
  } catch (error) {
    console.error("Failed to query categories on HomePage:", error);
  }

  const casualProducts = (casualCategory?.products || []).slice(0, 4);
  const formalProducts = (formalCategory?.products || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Brand Value Props Ribbon */}
      <BrandValueProps />

      {/* 4. Product Gallery (Everyday Casual) */}
      <DescriptiveGallerySection
        title="Everyday Casual"
        slug={casualCategory?.slug || "everyday-casual"}
        products={casualProducts}
      />

      {/* 5. Product Gallery (Formal Wear) */}
      <DescriptiveGallerySection
        title="Formal Wear"
        slug="formal-wear"
        products={formalProducts}
      />
    </div>
  );
}
