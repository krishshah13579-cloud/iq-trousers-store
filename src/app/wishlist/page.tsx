"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { formatPrice, getProductCoverImage } from "@/lib/utils";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export default function WishlistPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, toggleWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/wishlist");
    }
  }, [status, router]);

  const getProductImage = (imagesStr: string) => {
    return getProductCoverImage(imagesStr);
  };

  return (
    <div className="min-h-screen bg-white py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-100 pb-8 mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Saved Trousers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
              My Wishlist
            </h1>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-neutral-500 hover:text-black underline font-medium self-start sm:self-auto"
            >
              Clear all items
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-400 mx-auto mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">
              Your Wishlist is Empty
            </h2>
            <p className="text-xs text-neutral-500 mt-2 mb-8 leading-relaxed">
              Explore our Casual Everyday and Formal Wear collections to bookmark your favorite tailored trousers.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <span>Explore Trousers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => {
              const image = getProductImage(product.images);
              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="relative block aspect-[4/5] bg-neutral-50 overflow-hidden"
                  >
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {product.category?.name && (
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
                          {product.category.name}
                        </p>
                      )}
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm font-semibold text-neutral-900 hover:text-neutral-600 line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm font-bold text-neutral-900 mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center gap-2">
                      <Link
                        href={`/products/${product.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-black text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Select Size</span>
                      </Link>
                      <button
                        onClick={() => toggleWishlist(product)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
