"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShoppingCart, Plus, Minus, Check, AlertCircle, Zap, Heart, Ruler } from "lucide-react";
import { Product, SizeGuideRow } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import SizeGuideModal, { SizeGuideTable } from "./SizeGuideModal";
import { getColorHex } from "@/lib/colors";

interface AddToCartSectionProps {
  product: Product;
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWish = isInWishlist(product.id);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [added, setAdded] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isSizeGuideInlineOpen, setIsSizeGuideInlineOpen] = useState(false);

  const parsedSizeGuide: SizeGuideRow[] | null = (() => {
    if (!product.sizeGuide) return null;
    try {
      const parsed = JSON.parse(product.sizeGuide);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return null;
  })();

  const availableSizes: string[] = (() => {
    if (!product.sizes) {
      return ["28", "30", "32", "34", "36", "38", "40", "42", "44"];
    }
    try {
      const parsed = JSON.parse(product.sizes);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback to comma separated
    }
    if (typeof product.sizes === "string") {
      return product.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return ["28", "30", "32", "34", "36", "38", "40", "42", "44"];
  })();

  const inventoryMap: Record<string, Record<string, number>> | null = (() => {
    if (!product.inventory) return null;
    try {
      const parsed =
        typeof product.inventory === "string"
          ? JSON.parse(product.inventory)
          : product.inventory;
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return parsed as Record<string, Record<string, number>>;
      }
    } catch {}
    return null;
  })();

  const getVariantStock = (size?: string | null, color?: string | null): number => {
    if (!inventoryMap || Object.keys(inventoryMap).length === 0) {
      return product.stock;
    }
    const targetColor = (color || selectedColor || "").trim().toLowerCase();

    // Match color in inventoryMap (case-insensitive & trimmed)
    const matchedColorKey = Object.keys(inventoryMap).find(
      (k) => k.trim().toLowerCase() === targetColor
    );

    if (matchedColorKey && inventoryMap[matchedColorKey]) {
      const colSizes = inventoryMap[matchedColorKey];
      if (size) {
        const matchedSizeKey = Object.keys(colSizes).find(
          (sz) => sz.trim().toLowerCase() === size.trim().toLowerCase()
        );
        return matchedSizeKey !== undefined ? Number(colSizes[matchedSizeKey] || 0) : 0;
      }
      return Object.values(colSizes).reduce((a, b) => a + Number(b || 0), 0);
    }

    if (size) {
      let sizeSum = 0;
      let found = false;
      Object.values(inventoryMap).forEach((colMap) => {
        if (typeof colMap === "object" && colMap) {
          const matchedSizeKey = Object.keys(colMap).find(
            (sz) => sz.trim().toLowerCase() === size.trim().toLowerCase()
          );
          if (matchedSizeKey !== undefined) {
            sizeSum += Number(colMap[matchedSizeKey] || 0);
            found = true;
          }
        }
      });
      if (found) return sizeSum;
    }
    return product.stock;
  };

  const availableColors: string[] = (() => {
    let colorsList: string[] = [];
    if (product.colors) {
      try {
        const parsed = JSON.parse(product.colors);
        if (Array.isArray(parsed) && parsed.length > 0) colorsList = parsed;
      } catch {}
      if (colorsList.length === 0 && typeof product.colors === "string") {
        colorsList = product.colors.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }

    // Filter out any color variant that has 0 stock in inventoryMap
    if (inventoryMap && Object.keys(inventoryMap).length > 0 && colorsList.length > 0) {
      const inStockList = colorsList.filter((col) => {
        const colStock = getVariantStock(null, col);
        return colStock > 0;
      });
      if (inStockList.length > 0) return inStockList;
    }

    return colorsList;
  })();

  // Auto-select first available color if none is selected
  useEffect(() => {
    if (!selectedColor && availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  const activeColor = selectedColor || (availableColors.length > 0 ? availableColors[0] : null);

  const currentVariantStock = selectedSize
    ? getVariantStock(selectedSize, activeColor)
    : product.stock;

  const isOutOfStock = product.stock <= 0 || (Boolean(selectedSize) && currentVariantStock <= 0);
  const isLowStock = currentVariantStock > 0 && currentVariantStock <= 5;

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < currentVariantStock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (availableColors.length > 0 && !selectedColor) {
      setColorError(true);
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (currentVariantStock <= 0) {
      return;
    }

    if (status === "unauthenticated" || !session) {
      if (typeof window !== "undefined") {
        try {
          let firstImage = "";
          try {
            const parsedImgs = JSON.parse(product.images);
            if (Array.isArray(parsedImgs) && parsedImgs.length > 0) firstImage = parsedImgs[0];
          } catch {
            if (product.images?.startsWith("data:")) firstImage = product.images;
          }

          localStorage.setItem(
            "iq_pending_cart_item",
            JSON.stringify({
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                stock: product.stock,
                images: firstImage ? JSON.stringify([firstImage]) : "[]",
                categoryId: product.categoryId,
              },
              quantity,
              size: selectedSize || undefined,
              color: selectedColor || undefined,
            })
          );
        } catch (e) {
          console.warn("Storage quota warning when stashing pending item", e);
        }
      }
      router.push("/login?callbackUrl=/cart");
      return;
    }

    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (availableColors.length > 0 && !selectedColor) {
      setColorError(true);
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (currentVariantStock <= 0) {
      return;
    }

    if (status === "unauthenticated" || !session) {
      if (typeof window !== "undefined") {
        try {
          let firstImage = "";
          try {
            const parsedImgs = JSON.parse(product.images);
            if (Array.isArray(parsedImgs) && parsedImgs.length > 0) firstImage = parsedImgs[0];
          } catch {
            if (product.images?.startsWith("data:")) firstImage = product.images;
          }

          localStorage.setItem(
            "iq_pending_cart_item",
            JSON.stringify({
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                stock: product.stock,
                images: firstImage ? JSON.stringify([firstImage]) : "[]",
                categoryId: product.categoryId,
              },
              quantity,
              size: selectedSize || undefined,
              color: selectedColor || undefined,
            })
          );
        } catch (e) {
          console.warn("Storage quota warning when stashing pending item", e);
        }
      }
      router.push("/login?callbackUrl=/checkout");
      return;
    }

    addItem(product, quantity, selectedSize || undefined, selectedColor || undefined);
    router.push("/checkout");
  };

  return (
    <div className="space-y-6 pt-6 border-t border-gray-100">
      {/* Stock Status Indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            isOutOfStock
              ? "bg-rose-500"
              : isLowStock
              ? "bg-amber-500 animate-pulse"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-xs font-medium text-gray-700">
          {isOutOfStock
            ? selectedSize
              ? `Size ${selectedSize} is out of stock in ${activeColor || "this color"}`
              : "Out of stock"
            : isLowStock
            ? `Only ${currentVariantStock} left in stock - order soon`
            : "In stock and ready to ship"}
        </span>
      </div>

      {!isOutOfStock && (
        <>
          {/* Available Colors Palette */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Available Color:</span>
                  {selectedColor ? (
                    <span className="font-semibold text-gray-900 normal-case">
                      {selectedColor}
                    </span>
                  ) : (
                    <span className="font-normal text-gray-400 normal-case">
                      (Choose a color)
                    </span>
                  )}
                </label>
                {colorError && (
                  <span className="text-xs font-medium text-rose-600 animate-pulse">
                    Please select a color
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                {availableColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const { hex, isLight } = getColorHex(color);
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setColorError(false);
                        if (selectedSize && getVariantStock(selectedSize, color) <= 0) {
                          setSelectedSize(null);
                        }
                      }}
                      title={color}
                      aria-label={`Select color ${color}`}
                      className={`group relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "ring-2 ring-offset-2 ring-gray-950 scale-110 shadow-sm"
                          : "hover:scale-105 hover:shadow-xs ring-1 ring-black/10"
                      }`}
                      style={{
                        backgroundColor: hex,
                      }}
                    >
                      {/* Subtle border for light shades */}
                      {isLight && (
                        <span className="absolute inset-0 rounded-full border border-gray-300 pointer-events-none" />
                      )}

                      {/* Selected checkmark indicator */}
                      {isSelected && (
                        <Check
                          className={`w-4 h-4 ${
                            isLight ? "text-gray-900" : "text-white"
                          }`}
                          strokeWidth={2.5}
                        />
                      )}

                      {/* Tooltip on hover */}
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xs">
                        {color}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {availableSizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Select Size{" "}
                  {selectedSize && (
                    <span className="font-normal text-gray-500 normal-case">
                      (Size {selectedSize})
                    </span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideInlineOpen((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#162082] hover:text-black hover:underline transition-colors cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{isSizeGuideInlineOpen ? "Hide Size Guide" : "Size Guide"}</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  const sizeStock = getVariantStock(size, activeColor);
                  const isSoldOut = inventoryMap ? sizeStock <= 0 : false;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        if (isSoldOut) return;
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`relative min-w-[46px] h-10 px-3 text-xs font-medium rounded-lg border transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 shadow-xs cursor-pointer"
                          : isSoldOut
                          ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-50"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-900 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <span className={isSoldOut ? "line-through opacity-60" : ""}>{size}</span>
                      {isSoldOut && !isSelected && (
                        <span className="sr-only">(Sold out)</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 mt-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Please choose your size before adding to cart</span>
                </p>
              )}

              {/* Inline Size Guide beside photos - strictly for available sizes */}
              {isSizeGuideInlineOpen && (
                <div className="p-4 rounded-2xl border border-blue-200/90 bg-blue-50/20 animate-fadeIn space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#162082]" />
                      Size Guide (Available Sizes Only)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[11px] font-semibold text-[#162082] hover:underline cursor-pointer"
                    >
                      Enlarge View ↗
                    </button>
                  </div>
                  <SizeGuideTable
                    rows={parsedSizeGuide}
                    selectedSize={selectedSize || undefined}
                    availableSizes={availableSizes}
                    onSelectSize={(s) => {
                      setSelectedSize(s);
                      setSizeError(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between border border-gray-200 rounded-full px-3 py-1.5 w-full sm:w-36 bg-gray-50/50">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold text-gray-900 px-2 select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= currentVariantStock || currentVariantStock <= 0}
                aria-label="Increase quantity"
                className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={added || isOutOfStock || currentVariantStock <= 0}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                added
                  ? "bg-emerald-600 text-white"
                  : isOutOfStock || currentVariantStock <= 0
                  ? "bg-gray-300 text-gray-600"
                  : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99]"
              }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to cart!</span>
                </>
              ) : isOutOfStock || currentVariantStock <= 0 ? (
                <span>Out of Stock</span>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    Add to Cart {selectedSize ? `(Size ${selectedSize})` : ""}
                  </span>
                </>
              )}
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isWish ? "Remove from wishlist" : "Add to wishlist"}
              title={isWish ? "Remove from Wishlist" : "Add to Wishlist"}
              className={`p-3.5 rounded-full border transition-all duration-200 shadow-xs flex items-center justify-center cursor-pointer shrink-0 ${
                isWish
                  ? "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100 shadow-2xs"
                  : "border-gray-200 bg-white text-gray-700 hover:text-rose-600 hover:border-gray-300 hover:bg-gray-50 active:scale-95"
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isWish ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
            </button>
          </div>

          {/* Buy Now Instant Checkout Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock || currentVariantStock <= 0}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm bg-amber-400 hover:bg-amber-300 text-zinc-950 transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 text-zinc-950 fill-zinc-950" />
            <span>Buy Now (Instant Checkout)</span>
          </button>
        </>
      )}

      {isOutOfStock && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl text-gray-500 text-xs">
            <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>This item is currently sold out. Check back soon for restocks.</span>
          </div>
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm transition-all duration-200 border cursor-pointer ${
              isWish
                ? "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:text-black"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isWish ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
            <span>{isWish ? "Saved in Wishlist" : "Save to Wishlist"}</span>
          </button>
        </div>
      )}

      {/* Size Guide Modal Popup */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        rows={parsedSizeGuide}
        availableSizes={availableSizes}
        selectedSize={selectedSize || undefined}
        onSelectSize={(s) => {
          setSelectedSize(s);
          setSizeError(false);
        }}
      />
    </div>
  );
}
