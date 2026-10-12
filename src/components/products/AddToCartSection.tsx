"use client";

import { useState } from "react";
import { ShoppingCart, Plus, Minus, Check, AlertCircle } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";

interface AddToCartSectionProps {
  product: Product;
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((q) => q + 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
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
            ? "Out of stock"
            : isLowStock
            ? `Only ${product.stock} left in stock - order soon`
            : "In stock and ready to ship"}
        </span>
      </div>

      {!isOutOfStock && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
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
              disabled={quantity >= product.stock}
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
            disabled={added}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm transition-all duration-200 shadow-sm ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99]"
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to cart!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
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
