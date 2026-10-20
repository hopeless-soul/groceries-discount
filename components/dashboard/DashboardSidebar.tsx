"use client";

import { useEffect } from "react";
import { Menu } from "lucide-react";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { ShopKey } from "@/lib/config/shops";
import type { ShopStatus } from "@/lib/shops";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import type { Category } from "@/lib/types";

interface DashboardSidebarProps {
  categories: Category[];
  totalCount: number;
  statuses: Record<ShopKey, ShopStatus> | null;
}

export function DashboardSidebar({ categories, totalCount, statuses }: DashboardSidebarProps) {
  const isDesktop = useIsDesktop();
  const sidebarOpen = useDashboardUiStore((s) => s.sidebarOpen);
  const toggleSidebarOpen = useDashboardUiStore((s) => s.toggleSidebarOpen);

  // Force the drawer closed whenever the viewport changes size, so it never
  // reappears open after crossing the breakpoint.
  useEffect(() => {
    if (useDashboardUiStore.getState().sidebarOpen) {
      toggleSidebarOpen();
    }
  }, [isDesktop, toggleSidebarOpen]);

  if (isDesktop) {
    return (
      <div className="w-60 overflow-y-auto border-r border-[#e4e4e7] bg-white">
        <StoreList statuses={statuses} />
        <CategoryList categories={categories} totalCount={totalCount} />
      </div>
    );
  }

  return (
    <Drawer
      swipeDirection="left"
      open={sidebarOpen}
      onOpenChange={(open) => {
        if (open !== sidebarOpen) toggleSidebarOpen();
      }}
    >
      <DrawerTrigger
        aria-label="Open menu"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e4e7] bg-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </DrawerTrigger>
      <DrawerContent side="left">
        <StoreList statuses={statuses} />
        <CategoryList categories={categories} totalCount={totalCount} />
      </DrawerContent>
    </Drawer>
  );
}
