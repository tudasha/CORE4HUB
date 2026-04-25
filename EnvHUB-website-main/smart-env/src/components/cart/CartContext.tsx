"use client";

import { createContext } from "react";
import type { CartItemWithProduct } from "@/types";

export interface CartContextValue {
  items: CartItemWithProduct[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  handleAddToCart: (productId: string, quantity?: number) => Promise<void>;
  handleRemoveFromCart: (productId: string) => Promise<void>;
  handleUpdateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  isLoading: boolean;
}

export const CartContext = createContext<CartContextValue | null>(null);
