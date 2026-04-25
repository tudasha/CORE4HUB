import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrders } from "@/actions/orders";
import { ActiveConfig } from "@/components/dashboard/ActiveConfig";
import { OrderHistory } from "@/components/dashboard/OrderHistory";
import { Tutorials } from "@/components/dashboard/Tutorials";
import { User, LayoutDashboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your smart environment, orders, and device configuration.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const orders = await getOrders();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <LayoutDashboard className="w-3 h-3" />
              Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              Hey, {session.user?.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{session.user?.email}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <User className="w-5 h-5 text-green-400" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total orders", value: orders.length },
            {
              label: "Active devices",
              value: orders.filter((o) => o.status !== "CANCELLED").length * 2,
            },
            {
              label: "Total spent",
              value: `$${orders.reduce((s, o) => s + o.total, 0).toFixed(2)}`,
            },
            {
              label: "Tutorials done",
              value: "0 / 6",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="glass rounded-xl p-4 border border-white/5"
            >
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-black text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ActiveConfig orders={orders as any} />
            <OrderHistory orders={orders as any} />
          </div>
          <div>
            <Tutorials />
          </div>
        </div>
      </div>
    </div>
  );
}
