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
        className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-100 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0"
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
          "flex h-full w-[280px] flex-col overflow-y-auto bg-white shadow-lg outline-none transition-transform duration-200 ease-out transform-[translateX(var(--drawer-swipe-movement-x))] data-swiping:duration-0",
          side === "left"
            ? "border-r border-[#e4e4e7] data-ending-style:transform-[translateX(-100%)] data-starting-style:transform-[translateX(-100%)]"
            : "border-l border-[#e4e4e7] data-ending-style:transform-[translateX(100%)] data-starting-style:transform-[translateX(100%)]",
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
