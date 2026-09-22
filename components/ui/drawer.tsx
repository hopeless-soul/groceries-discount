"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"
import { cn } from "cn"

const Drawer = DrawerPrimitive.Root
const DrawerTrigger = DrawerPrimitive.Trigger
const DrawerClose = DrawerPrimitive.Close

function DrawerPortal({
  side = "left",
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal> & { side?: "left" | "right" }) {
  return (
    <DrawerPrimitive.Portal {...props}>
      <DrawerPrimitive.Backdrop
        data-slot="drawer-backdrop"
        className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
      />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className={cn(
          "fixed inset-y-0 z-50 flex",
          side === "left" ? "left-0 justify-start" : "right-0 justify-end"
        )}
      >
        {children}
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

function DrawerContent({
  className,
  side = "left",
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup> & { side?: "left" | "right" }) {
  return (
    <DrawerPortal side={side}>
      <DrawerPrimitive.Popup
        data-slot="drawer-content"
        className={cn(
          "flex h-full w-[280px] flex-col overflow-y-auto bg-white shadow-lg outline-none [transform:translateX(var(--drawer-swipe-movement-x))] data-ending-style:duration-150 data-starting-style:duration-150",
          side === "left" ? "border-r border-[#e4e4e7]" : "border-l border-[#e4e4e7]",
          className
        )}
        {...props}
      >
        {children}
      </DrawerPrimitive.Popup>
    </DrawerPortal>
  )
}

export { Drawer, DrawerTrigger, DrawerClose, DrawerPortal, DrawerContent }
