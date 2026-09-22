"use client";

import { Menu } from "lucide-react";
import { StoreList } from "@/components/dashboard/StoreList";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useDashboardUiStore } from "@/lib/stores/dashboard-ui-store";
import type { Category } from "@/lib/types";

interface DashboardSidebarProps {
  categories: Category[];
  totalCount: number;
}

export function DashboardSidebar({ categories, totalCount }: DashboardSidebarProps) {
  const isDesktop = useIsDesktop();
  const sidebarOpen = useDashboardUiStore((s) => s.sidebarOpen);
  const toggleSidebarOpen = useDashboardUiStore((s) => s.toggleSidebarOpen);

  if (isDesktop) {
    return (
      <div className="w-[240px] overflow-y-auto border-r border-[#e4e4e7] bg-white">
        <StoreList />
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
        <StoreList />
        <CategoryList categories={categories} totalCount={totalCount} />
      </DrawerContent>
    </Drawer>
  );
}
