"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { checkoutAction } from "@/actions/orders";
import { removeFromCart, updateCartQuantity } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CartItemWithProduct } from "@/types";

interface CartPageClientProps {
  initialItems: CartItemWithProduct[];
}

export function CartPageClient({ initialItems }: CartPageClientProps) {
  const [items, setItems] = useState(initialItems);
  const [state, formAction, isPending] = useActionState(checkoutAction, null);
  const { clearCart } = useCart();

  useEffect(() => {
    if (state?.success) {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleRemove = async (productId: string) => {
    await removeFromCart(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleQty = async (productId: string, qty: number) => {
    if (qty <= 0) return handleRemove(productId);
    await updateCartQuantity(productId, qty);
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  if (state?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Order placed!</h2>
        <p className="text-gray-500 mb-8">
          Your hardware is being prepared. Track it in your dashboard.
        </p>
        <Link href="/dashboard">
          <Button className="bg-green-500 hover:bg-green-400 text-black font-bold">
            View Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">🛒</span>
        <h2 className="text-2xl font-black text-white mb-2">Empty cart</h2>
        <p className="text-gray-500 mb-8">Add some devices to get started.</p>
        <Link href="/catalog">
          <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" /> Browse Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items */}
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass rounded-xl p-4 flex items-start gap-4 border border-white/5"
            id={`cart-item-${item.productId}`}
          >
            <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-3xl flex-shrink-0">
              📡
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white">{item.product.name}</h3>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                {item.product.description}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 glass rounded-lg p-1">
                  <button
                    onClick={() => handleQty(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                    id={`cart-page-dec-${item.productId}`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQty(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors text-gray-400 hover:text-white"
                    id={`cart-page-inc-${item.productId}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                  id={`cart-page-remove-${item.productId}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white">
                ${(item.product.price * item.quantity).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                ${item.product.price.toFixed(2)} each
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary + Checkout */}
      <div className="lg:col-span-1">
        <div className="glass rounded-2xl p-6 border border-white/5 sticky top-24">
          <h2 className="font-bold text-white text-lg mb-5 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-400" />
            Summary
          </h2>

          <div className="space-y-2 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-500 truncate max-w-[160px]">
                  {item.product.name} ×{item.quantity}
                </span>
                <span className="text-gray-400 ml-2">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator className="bg-white/5 my-4" />

          <div className="flex justify-between mb-6">
            <span className="text-gray-400">Total</span>
            <span className="text-2xl font-black text-white">${total.toFixed(2)}</span>
          </div>

          {state?.error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {state.error}
            </div>
          )}

          <form action={formAction} id="checkout-form" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkout-address" className="text-sm text-gray-400">
                Shipping address
              </Label>
              <textarea
                id="checkout-address"
                name="address"
                placeholder="Street, City, Country, ZIP"
                required
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 resize-none"
              />
            </div>

            <Button
              id="checkout-submit-btn"
              type="submit"
              disabled={isPending || items.length === 0}
              className="w-full h-11 bg-green-500 hover:bg-green-400 text-black font-bold text-base"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Place Order"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
