"use client";

import type { Category } from "@/lib/types";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";

interface CategoryListProps {
  categories: Category[];
  totalCount: number;
}

export function CategoryList({ categories, totalCount }: CategoryListProps) {
  const activeCategory = useDashboardUiStore((s) => s.activeCategory);
  const setActiveCategory = useDashboardUiStore((s) => s.setActiveCategory);

  const rows = [{ id: "All", name: "All", count: totalCount }, ...categories];

  return (
    <div className="flex flex-col gap-1 p-3">
      {rows.map((row) => {
        const active = row.id === activeCategory;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => setActiveCategory(row.id)}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
              active ? "bg-[#f4f4f5] border border-[#e4e4e7]" : "border border-transparent"
            }`}
          >
            <span>{row.name}</span>
            <span className="text-[#a1a1aa]">{row.count}</span>
          </button>
        );
      })}
    </div>
  );
}
