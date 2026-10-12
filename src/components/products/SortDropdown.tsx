"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface SortDropdownProps {
  currentSort?: string;
}

export default function SortDropdown({ currentSort = "newest" }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const val = e.target.value;
    if (val && val !== "newest") {
      params.set("sort", val);
    } else {
      params.delete("sort");
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 hidden sm:inline">Sort by:</span>
      <div className="relative inline-flex items-center">
        <select
          value={currentSort}
          onChange={handleSortChange}
          aria-label="Sort products"
          className="appearance-none bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 cursor-pointer"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name">Product Name (A-Z)</option>
        </select>
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
      </div>
    </div>
  );
}
