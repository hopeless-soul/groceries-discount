"use client";

import { SlidersHorizontal } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { SortOption } from "@/lib/stores/dashboard-ui-store";

export const SORT_LABELS: Record<SortOption, string> = {
  default: "Default",
  discountPercent: "Most discounted %",
  discountAmount: "Most discounted €",
};

interface DashboardFiltersProps {
  showImages: boolean;
  toggleShowImages: () => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
}

function SortSelect({ sortBy, setSortBy }: Pick<DashboardFiltersProps, "sortBy" | "setSortBy">) {
  return (
    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
      <SelectTrigger aria-label="Sort by" className="w-full">
        <SelectValue placeholder="Sort">{(value) => SORT_LABELS[value as SortOption]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DashboardFilters({ showImages, toggleShowImages, sortBy, setSortBy }: DashboardFiltersProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <div className="flex items-center">
        <label className="ml-4 flex items-center gap-2 text-sm text-[#71717a]">
          <Switch checked={showImages} onCheckedChange={toggleShowImages} />
          Show images
        </label>
        <div className="ml-4 w-[190px]">
          <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Filters"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-[#e4e4e7] bg-white"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="flex w-[220px] flex-col gap-4">
        <label className="flex items-center justify-between gap-2 text-sm text-[#71717a]">
          Show images
          <Switch checked={showImages} onCheckedChange={toggleShowImages} />
        </label>
        <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
      </PopoverContent>
    </Popover>
  );
}
