"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Check, AlertCircle, Zap } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface AddToCartSectionProps {
  product: Product;
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

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

  const availableColors: string[] = (() => {
    if (!product.colors) return [];
    try {
      const parsed = JSON.parse(product.colors);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // fallback
    }
    if (typeof product.colors === "string") {
      return product.colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    return [];
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

  const activeColor = selectedColor || (availableColors.length > 0 ? availableColors[0] : null);

  const getVariantStock = (size?: string | null, color?: string | null): number => {
    if (!inventoryMap) {
      return product.stock;
    }
    const targetColor = color || activeColor;
    if (targetColor && inventoryMap[targetColor]) {
      if (size && inventoryMap[targetColor][size] !== undefined) {
        return Number(inventoryMap[targetColor][size]);
      }
      return Object.values(inventoryMap[targetColor]).reduce(
        (a, b) => a + Number(b || 0),
        0
      );
    }
    if (size) {
      let sizeSum = 0;
      let found = false;
      Object.values(inventoryMap).forEach((colMap) => {
        if (typeof colMap === "object" && colMap && colMap[size] !== undefined) {
          sizeSum += Number(colMap[size]);
          found = true;
        }
      });
      if (found) return sizeSum;
    }
    return product.stock;
  };

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
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (currentVariantStock <= 0) {
      return;
    }
    addItem(product, quantity, selectedSize || undefined, activeColor || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    if (currentVariantStock <= 0) {
      return;
    }
    addItem(product, quantity, selectedSize || undefined, activeColor || undefined);
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
          {/* Available Colors Selector */}
          {availableColors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                  Available Color{" "}
                  {selectedColor && (
                    <span className="font-normal text-gray-500 normal-case">
                      ({selectedColor})
                    </span>
                  )}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const isSelected = (selectedColor || availableColors[0]) === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span>{color}</span>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
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
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`relative min-w-[46px] h-10 px-3 text-xs font-medium rounded-lg border transition-all duration-150 flex items-center justify-center ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 shadow-xs"
                          : isSoldOut
                          ? "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                          : "bg-white text-gray-800 border-gray-200 hover:border-gray-900 hover:bg-gray-50"
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
        <div className="flex items-center gap-2 p-3.5 bg-gray-50 rounded-xl text-gray-500 text-xs">
          <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span>This item is currently sold out. Check back soon for restocks.</span>
        </div>
      )}
    </div>
  );
}
