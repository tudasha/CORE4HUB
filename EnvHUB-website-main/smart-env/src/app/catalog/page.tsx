import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Category } from "@prisma/client";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse 200+ IoT sensors, actuators, gateways, and smart home kits.",
};

interface CatalogPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = await searchParams;
  const categoryParam = params.category?.toUpperCase();
  const search = params.search;

  const validCategory =
    categoryParam && Object.values(Category).includes(categoryParam as Category)
      ? (categoryParam as Category)
      : undefined;

  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        ...(validCategory && { category: validCategory }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });
  } catch (e) {
    console.warn("Failed to fetch catalog products (DB unreachable):", e);
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
            Catalog
          </p>
          <h1 className="text-4xl font-black text-white mb-2">All devices.</h1>
          <p className="text-gray-500">
            {products.length} device{products.length !== 1 ? "s" : ""} available
          </p>
        </div>

        <CatalogFilters
          activeCategory={validCategory}
          activeSearch={search}
        />

        <div className="mt-8">
          <ProductGrid products={products as any} />
        </div>
      </div>
    </div>
  );
}
