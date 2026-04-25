import { Cpu, Package } from "lucide-react";
import type { OrderWithItems } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CATEGORY_ICONS: Record<string, string> = {
  SENSOR: "📡",
  ACTUATOR: "⚙️",
  GATEWAY: "🌐",
  HUB: "🏠",
  KIT: "📦",
};

interface ActiveConfigProps {
  orders: OrderWithItems[];
}

export function ActiveConfig({ orders }: ActiveConfigProps) {
  // Get all unique products from non-cancelled orders
  const activeProducts = orders
    .filter((o) => o.status !== "CANCELLED")
    .flatMap((o) => o.items.map((item) => item.product))
    .filter(
      (product, index, self) => self.findIndex((p) => p.id === product.id) === index
    )
    .slice(0, 6);

  return (
    <div className="glass rounded-2xl p-6 border border-white/5" id="active-config">
      <div className="flex items-center gap-2 mb-5">
        <Cpu className="w-5 h-5 text-green-400" />
        <h2 className="font-bold text-white text-lg">Active Configuration</h2>
        {activeProducts.length > 0 && (
          <span className="ml-auto text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            {activeProducts.length} device{activeProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {activeProducts.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No devices deployed yet.</p>
          <p className="text-gray-700 text-xs mt-1 mb-4">
            Use the AI assistant on the homepage to get started.
          </p>
          <Link href="/">
            <Button
              size="sm"
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20"
            >
              Get AI Recommendation
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {activeProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 text-center hover:border-green-500/20 transition-colors"
            >
              <span className="text-2xl">{CATEGORY_ICONS[product.category] ?? "📦"}</span>
              <div>
                <p className="text-xs font-medium text-white leading-tight">
                  {product.name}
                </p>
                <span className="text-[10px] text-gray-600">{product.category}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500">Online</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
