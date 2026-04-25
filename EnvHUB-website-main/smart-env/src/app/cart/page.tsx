import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCartItems } from "@/actions/cart";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your cart and checkout.",
};

export default async function CartPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const items = await getCartItems();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
            Checkout
          </p>
          <h1 className="text-4xl font-black text-white">Your cart.</h1>
        </div>
        <CartPageClient initialItems={items as any} />
      </div>
    </div>
  );
}
