import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, ShieldCheck, Truck, RotateCcw, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import AddToCartSection from "@/components/products/AddToCartSection";
import DeliveryPincodeChecker from "@/components/products/DeliveryPincodeChecker";
import ProductDetailsAccordions from "@/components/products/ProductDetailsAccordions";
import ProductReviewsSection from "@/components/products/ProductReviewsSection";
import ProductCard from "@/components/products/ProductCard";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  let product = null;
  try {
    product = await prisma.product.findFirst({
      where: {
        OR: [
          { id },
          { slug: { equals: id, mode: "insensitive" } },
          { name: { equals: id, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to query product details:", error);
    product = null;
  }

  if (!product) {
    notFound();
  }

  // Parse images
  let images: string[] = [];
  try {
    const parsed = JSON.parse(product.images);
    if (Array.isArray(parsed)) {
      images = parsed.map((img) => String(img).trim()).filter(Boolean);
    } else if (typeof parsed === "string" && parsed.trim()) {
      images = [parsed.trim()];
    }
  } catch {
    if (typeof product.images === "string" && product.images.trim()) {
      if (product.images.startsWith("data:")) {
        images = [product.images.trim()];
      } else {
        images = product.images
          .split(",")
          .map((img: string) => img.trim())
          .filter(Boolean);
      }
    }
  }

  // Parse available sizes for size guide filtering
  let availableSizes: string[] = [];
  try {
    const parsedSizes = JSON.parse(product.sizes || "[]");
    if (Array.isArray(parsedSizes) && parsedSizes.length > 0) {
      availableSizes = parsedSizes.map(String);
    }
  } catch {
    if (typeof product.sizes === "string") {
      availableSizes = product.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }

  // Fetch related products from the same category
  let relatedProducts: any[] = [];
  try {
    relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        active: true,
      },
      include: {
        category: true,
        reviews: true,
      },
      take: 4,
    });
  } catch (error) {
    console.error("Failed to query related products:", error);
    relatedProducts = [];
  }

  // Calculate review stats
  const totalReviews = product.reviews.length;
  const avgRating =
    totalReviews > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

  const discountPercent =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center text-xs text-gray-500 space-x-2">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link href="/products" className="hover:text-gray-900 transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Product Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Product Images */}
          <div className="lg:col-span-7">
            <ProductImageGallery images={images} name={product.name} />
          </div>

          {/* Right: Details & Purchase */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
            <div>
              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-2xl sm:text-3xl font-normal text-gray-900 tracking-tight mt-1.5 leading-snug">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(avgRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200 fill-gray-100"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {avgRating > 0 ? avgRating.toFixed(1) : "New"}
                </span>
                <span className="text-xs text-gray-400">
                  ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            {/* Price Tag */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-semibold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-base text-gray-400 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                  {discountPercent && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                      Save {discountPercent}%
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Interactive Add to Cart & Stock Status */}
            <AddToCartSection product={product} />

            {/* Estimated Delivery Date & DTDC Courier by Pincode */}
            <DeliveryPincodeChecker />

            {/* Collapsible Accordions: Size Guide (Before Product Description!), Product Description & Care Instructions */}
            <ProductDetailsAccordions
              description={product.description}
              careInstructions={product.careInstructions}
              sizeGuide={product.sizeGuide}
              availableSizes={availableSizes}
            />
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 pt-16 border-t border-gray-100">
          <ProductReviewsSection
            productId={product.id}
            initialReviews={product.reviews}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-gray-100">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Recommendations
                </span>
                <h2 className="text-2xl font-light text-gray-900 mt-1">
                  You May Also <span className="font-medium">Like</span>
                </h2>
              </div>
              {product.category && (
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors"
                >
                  View more in {product.category.name} →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
