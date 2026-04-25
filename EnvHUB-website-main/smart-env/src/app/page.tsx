import { HeroAI } from "@/components/home/HeroAI";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <>
      <HeroAI />
      <HowItWorks />
      <Suspense fallback={
        <div className="py-24 px-4 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="h-8 w-48 skeleton rounded-lg mb-12" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-72 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      }>
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
