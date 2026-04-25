"use client";

import React, { useState, useContext } from "react";
import type { CartItemWithProduct } from "@/types";
import { toast } from "sonner";
import { CartContext } from "./CartContext";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = async () => {
    try {
      const { getCartItems } = await import("@/actions/cart");
      const data = await getCartItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    }
  };

  React.useEffect(() => {
    fetchCart();
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleAddToCart = async (productId: string, quantity = 1) => {
    setIsLoading(true);
    const { addToCart } = await import("@/actions/cart");
    const result = await addToCart(productId, quantity);
    
    if (result.success) {
      await fetchCart();
      toast.success("Added to cart", { description: "Item added successfully." });
      setIsOpen(true);
    } else {
      toast.error("Error", {
        description: result.error ?? "Failed to add item",
      });
    }
    setIsLoading(false);
  };

  const handleRemoveFromCart = async (productId: string) => {
    setIsLoading(true);
    const { removeFromCart } = await import("@/actions/cart");
    await removeFromCart(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    setIsLoading(false);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    setIsLoading(true);
    const { updateCartQuantity } = await import("@/actions/cart");
    await updateCartQuantity(productId, quantity);
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      );
    }
    setIsLoading(false);
  };

  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isOpen,
        setIsOpen,
        handleAddToCart,
        handleRemoveFromCart,
        handleUpdateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
