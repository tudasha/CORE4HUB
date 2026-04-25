"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@prisma/client";
import { Search, X } from "lucide-react";
import { useState, useTransition } from "react";

const CATEGORIES = [
  { label: "All", value: undefined },
  { label: "Sensors", value: "SENSOR" as Category },
  { label: "Hubs", value: "HUB" as Category },
  { label: "Kits", value: "KIT" as Category },
];

interface CatalogFiltersProps {
  activeCategory?: Category;
  activeSearch?: string;
}

export function CatalogFilters({ activeCategory, activeSearch }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(activeSearch ?? "");

  const setCategory = (cat?: Category) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat.toLowerCase());
    } else {
      params.delete("category");
    }
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`/catalog?${params.toString()}`);
    });
  };

  const clearSearch = () => {
    setSearchValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md" id="catalog-search-form">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          id="catalog-search-input"
          type="text"
          placeholder="Search devices..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:bg-white/8 transition-all"
        />
        {searchValue && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" id="catalog-category-filters">
        {CATEGORIES.map(({ label, value }) => {
          const isActive = activeCategory === value;
          return (
            <button
              key={label}
              id={`filter-${label.toLowerCase()}`}
              onClick={() => setCategory(value)}
              disabled={isPending}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isActive
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              } ${isPending ? "opacity-50" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
