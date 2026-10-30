"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { CartItemType } from "@/types";
import { getProductCoverImage } from "@/lib/utils";

interface CartContextType {
  items: CartItemType[];
  addItem: (
    product: CartItemType["product"],
    quantity?: number,
    size?: string,
    color?: string
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateVariant: (itemId: string, newSize?: string, newColor?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getUserCartKey(session: Session | null | undefined): string | null {
  if (!session?.user) return null;
  const email = session.user.email?.trim().toLowerCase();
  if (email) return `iq_cart_${email}`;
  const id = (session.user as { id?: string }).id;
  if (id) return `iq_cart_${id}`;
  return null;
}

/**
 * Compacts the product object for storage so that 10 full-resolution Base64
 * photos (~4 MB) do not blow up the browser's 5 MB localStorage quota.
 * Keeps only the primary thumbnail image needed for cart/checkout preview.
 */
function sanitizeCartProduct(product: CartItemType["product"]): CartItemType["product"] {
  if (!product) return product;

  const thumbnail = getProductCoverImage(product.images);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price) || 0,
    comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
    stock: Number(product.stock) || 0,
    images: thumbnail ? JSON.stringify([thumbnail]) : "[]",
    colors: product.colors || null,
    sizes: product.sizes || null,
    inventory: product.inventory || null,
    categoryId: product.categoryId,
  } as any;
}

function sanitizeCartItem(item: CartItemType): CartItemType {
  return {
    id: item.id,
    productId: item.productId,
    size: item.size,
    color: item.color,
    quantity: Number(item.quantity) || 1,
    product: sanitizeCartProduct(item.product),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItemType[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentKeyRef = useRef<string | null>(null);

  // Sync cart based on current session and process any pending items
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      currentKeyRef.current = null;
      setItems([]);
      setIsLoaded(true);
      return;
    }

    if (status === "authenticated") {
      const userKey = getUserCartKey(session);
      if (!userKey) return;

      currentKeyRef.current = userKey;
      let loadedItems: CartItemType[] = [];

      try {
        const userSaved = localStorage.getItem(userKey);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          if (Array.isArray(parsed)) {
            loadedItems = parsed
              .filter((item) => item && item.product && typeof item.product === "object")
              .map(sanitizeCartItem);
          }
        } else {
          // Migration from legacy "cart" key if user-specific key doesn't exist yet
          const legacySaved = localStorage.getItem("cart");
          if (legacySaved) {
            const parsed = JSON.parse(legacySaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedItems = parsed
                .filter((item) => item && item.product && typeof item.product === "object")
                .map(sanitizeCartItem);
              localStorage.setItem(userKey, JSON.stringify(loadedItems));
            }
          }
        }
        // Free bloated legacy cart from storage
        localStorage.removeItem("cart");
      } catch (e) {
        console.error("Error reading cart from localStorage", e);
      }

      // Check and apply pending cart item (from unauthenticated Add to Cart)
      try {
        const pendingRaw = localStorage.getItem("iq_pending_cart_item");
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          if (pending && pending.product && pending.product.id) {
            localStorage.removeItem("iq_pending_cart_item");
            const cleanProduct = sanitizeCartProduct(pending.product);
            const quantity = Number(pending.quantity) || 1;
            const size = pending.size || undefined;
            const color = pending.color || undefined;

            const existingIndex = loadedItems.findIndex(
              (it) =>
                it.productId === cleanProduct.id &&
                it.size === size &&
                it.color === color
            );
            if (existingIndex > -1) {
              loadedItems[existingIndex] = {
                ...loadedItems[existingIndex],
                quantity: loadedItems[existingIndex].quantity + quantity,
              };
            } else {
              loadedItems.push({
                id: `${cleanProduct.id}-${size || "nosize"}-${color || "nocolor"}-${Date.now()}`,
                productId: cleanProduct.id,
                size,
                color,
                quantity,
                product: cleanProduct,
              });
            }
            localStorage.setItem(userKey, JSON.stringify(loadedItems));
          }
        }
      } catch (e) {
        console.error("Error applying pending cart item:", e);
      }

      setItems(loadedItems);
      setIsLoaded(true);
    }
  }, [status, session]);

  // Save cart to user-scoped localStorage whenever items change
  useEffect(() => {
    if (!isLoaded || status !== "authenticated") return;
    const userKey = getUserCartKey(session);
    if (!userKey) return;
    try {
      const sanitized = items.map(sanitizeCartItem);
      localStorage.setItem(userKey, JSON.stringify(sanitized));
      // Remove unneeded legacy key to preserve storage quota
      if (userKey !== "cart") {
        localStorage.removeItem("cart");
      }
    } catch (e) {
      console.warn("Storage quota warning, pruning bloated keys and retrying", e);
      try {
        localStorage.removeItem("cart");
        localStorage.removeItem("iq_pending_cart_item");
        // Emergency compact payload without images to prevent UI failure
        const ultraCompact = items.map((it) => ({
          ...it,
          product: {
            id: it.product.id,
            name: it.product.name,
            slug: it.product.slug,
            price: Number(it.product.price) || 0,
            stock: Number(it.product.stock) || 0,
            images: "[]",
          },
        }));
        localStorage.setItem(userKey, JSON.stringify(ultraCompact));
      } catch (err2) {
        console.warn("LocalStorage quota strictly exceeded, keeping state in memory", err2);
      }
    }
  }, [items, isLoaded, session, status]);

  const addItem = (
    product: CartItemType["product"],
    quantity = 1,
    size?: string,
    color?: string
  ) => {
    const cleanProduct = sanitizeCartProduct(product);

    if (status !== "authenticated") {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "iq_pending_cart_item",
            JSON.stringify({ product: cleanProduct, quantity, size, color })
          );
        } catch (e) {
          console.warn("Could not save pending cart item", e);
        }
      }
      return;
    }

    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === cleanProduct.id &&
          item.size === size &&
          item.color === color
      );
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `${cleanProduct.id}-${size || "nosize"}-${color || "nocolor"}-${Date.now()}`,
          productId: cleanProduct.id,
          size,
          color,
          quantity,
          product: cleanProduct,
        },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) =>
      prev.filter((item) => item.id !== itemId && item.productId !== itemId)
    );
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId || item.productId === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updateVariant = (itemId: string, newSize?: string, newColor?: string) => {
    setItems((prev) => {
      const targetItem = prev.find((it) => it.id === itemId);
      if (!targetItem) return prev;

      const size = newSize !== undefined ? newSize : targetItem.size;
      const color = newColor !== undefined ? newColor : targetItem.color;

      // Check if there is already an item in the cart with the new size & color
      const existingOther = prev.find(
        (it) => it.id !== itemId && it.productId === targetItem.productId && it.size === size && it.color === color
      );

      if (existingOther) {
        // Merge quantities and remove current item
        return prev
          .filter((it) => it.id !== itemId)
          .map((it) =>
            it.id === existingOther.id
              ? { ...it, quantity: it.quantity + targetItem.quantity }
              : it
          );
      }

      // Update variant on current item
      return prev.map((it) =>
        it.id === itemId
          ? { ...it, size, color }
          : it
      );
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce(
    (sum, item) => sum + (Number(item?.quantity) || 0),
    0
  );
  const totalPrice = items.reduce(
    (sum, item) =>
      sum + (Number(item?.product?.price) || 0) * (Number(item?.quantity) || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateVariant,
        clearCart,
        totalItems,
        totalPrice,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
