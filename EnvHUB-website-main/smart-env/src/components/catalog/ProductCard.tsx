"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap } from "lucide-react";
import { useState } from "react";
import type { ProductWithCategory } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  SENSOR: "📡",
  ACTUATOR: "⚙️",
  GATEWAY: "📡",
  HUB: "📱",
  KIT: "📦",
};

const CATEGORY_COLORS: Record<string, string> = {
  SENSOR: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACTUATOR: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  GATEWAY: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  HUB: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  KIT: "bg-green-500/10 text-green-400 border-green-500/20",
};

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const { handleAddToCart, isLoading } = useCart();
  const [added, setAdded] = useState(false);

  const onAddToCart = async () => {
    await handleAddToCart(product.id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className="group glass rounded-2xl overflow-hidden card-hover border border-white/5 flex flex-col"
      id={`product-card-${product.slug}`}
    >
      {/* Image placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-white/5 to-white/[0.02] overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          {CATEGORY_ICONS[product.category] ?? "📦"}
        </div>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/40 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[product.category]}`}
          >
            {product.category}
          </span>
        </div>

        {/* Stock indicator */}
        {product.stock < 20 && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" />
              Low stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-white text-sm leading-tight mb-1.5 group-hover:text-green-400 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed flex-1 line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-xl font-black text-white">
              ${product.price.toFixed(2)}
            </p>
          </div>
          <Button
            id={`add-to-cart-${product.slug}`}
            onClick={onAddToCart}
            disabled={isLoading}
            size="sm"
            className={`h-8 px-3 font-semibold text-xs rounded-lg transition-all ${
              added
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-green-500 hover:bg-green-400 text-black"
            }`}
          >
            {added ? (
              "Added ✓"
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
