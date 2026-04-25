"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, total, handleRemoveFromCart, handleUpdateQuantity, isLoading } =
    useCart();
  const router = useRouter();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#0f0f0f] border-white/10 text-white flex flex-col"
        id="cart-drawer"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5 text-green-400" />
            Cart
            {items.length > 0 && (
              <span className="ml-auto text-sm text-gray-400 font-normal">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <Separator className="bg-white/5" />

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 no-scrollbar">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">Your cart is empty</p>
              <p className="text-gray-600 text-sm mt-1">Add some devices to get started</p>
              <Button
                id="cart-browse-btn"
                variant="outline"
                size="sm"
                className="mt-4 border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                onClick={() => { setIsOpen(false); router.push("/catalog"); }}
              >
                Browse catalog
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-14 h-14 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-900/20 flex items-center justify-center text-xl">
                    📡
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ${item.product.price.toFixed(2)} each
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      id={`cart-qty-dec-${item.productId}`}
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      disabled={isLoading}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      id={`cart-qty-inc-${item.productId}`}
                      onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      disabled={isLoading}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="ml-auto text-sm font-semibold text-green-400">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  id={`cart-remove-${item.productId}`}
                  onClick={() => handleRemoveFromCart(item.productId)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  disabled={isLoading}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Subtotal</span>
              <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
            </div>
            <Button
              id="cart-checkout-btn"
              className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-12 text-base"
              onClick={() => { setIsOpen(false); router.push("/cart"); }}
            >
              <div className="flex items-center gap-2">
                Checkout
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
