import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/catalog/ProductCard";

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { featured: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.warn("Failed to fetch featured products (DB unreachable):", e);
    return [];
  }
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  return (
    <section className="py-24 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
              Catalog
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Popular devices.
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/catalog"
            className="text-sm text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            View all devices <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
