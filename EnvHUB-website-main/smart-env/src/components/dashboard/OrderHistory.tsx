import { ShoppingBag, ArrowRight } from "lucide-react";
import type { OrderWithItems } from "@/types";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface OrderHistoryProps {
  orders: OrderWithItems[];
}

export function OrderHistory({ orders }: OrderHistoryProps) {
  return (
    <div className="glass rounded-2xl p-6 border border-white/5" id="order-history">
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBag className="w-5 h-5 text-green-400" />
        <h2 className="font-bold text-white text-lg">Order History</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-10">
          <ShoppingBag className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No orders yet.</p>
          <p className="text-gray-700 text-xs mt-1">
            Browse the catalog and place your first order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              id={`order-${order.id}`}
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}
                >
                  {order.status}
                </span>
                <span className="text-sm font-bold text-white">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
