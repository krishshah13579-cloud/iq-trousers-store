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
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
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
            loadedItems = parsed.filter(
              (item) => item && item.product && typeof item.product === "object"
            );
          }
        } else {
          // Migration from legacy "cart" key if user-specific key doesn't exist yet
          const legacySaved = localStorage.getItem("cart");
          if (legacySaved) {
            const parsed = JSON.parse(legacySaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedItems = parsed.filter(
                (item) => item && item.product && typeof item.product === "object"
              );
              localStorage.setItem(userKey, JSON.stringify(loadedItems));
            }
          }
        }
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
            const quantity = Number(pending.quantity) || 1;
            const size = pending.size || undefined;
            const color = pending.color || undefined;

            const existingIndex = loadedItems.findIndex(
              (it) =>
                it.productId === pending.product.id &&
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
                id: `${pending.product.id}-${size || "nosize"}-${color || "nocolor"}-${Date.now()}`,
                productId: pending.product.id,
                size,
                color,
                quantity,
                product: pending.product,
              });
            }
            localStorage.setItem(userKey, JSON.stringify(loadedItems));
            localStorage.setItem("cart", JSON.stringify(loadedItems));
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
      localStorage.setItem(userKey, JSON.stringify(items));
      localStorage.setItem("cart", JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded, session, status]);

  const addItem = (
    product: CartItemType["product"],
    quantity = 1,
    size?: string,
    color?: string
  ) => {
    if (status !== "authenticated") {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "iq_pending_cart_item",
          JSON.stringify({ product, quantity, size, color })
        );
      }
      return;
    }

    setItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
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
          id: `${product.id}-${size || "nosize"}-${color || "nocolor"}-${Date.now()}`,
          productId: product.id,
          size,
          color,
          quantity,
          product,
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
        clearCart,
        totalItems,
        totalPrice,
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
