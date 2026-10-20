"use client"

import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

type CarouselContextProps = {
  carouselRef: UseEmblaCarouselType[0]
  orientation: "horizontal" | "vertical"
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error("useCarousel must be used within a <Carousel />")
  return context
}

type CarouselApi = NonNullable<UseEmblaCarouselType[1]>

function Carousel({
  className,
  children,
  orientation = "horizontal",
  opts,
  setApi,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
  opts?: Parameters<typeof useEmblaCarousel>[0]
  setApi?: (api: CarouselApi) => void
}) {
  const [carouselRef, api] = useEmblaCarousel({
    axis: orientation === "vertical" ? "y" : "x",
    ...opts,
  })

  React.useEffect(() => {
    if (api) setApi?.(api)
  }, [api, setApi])
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((emblaApi: NonNullable<typeof api>) => {
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!api) return
    // Deferred so the initial sync isn't a synchronous setState in the effect body.
    queueMicrotask(() => onSelect(api))
    api.on("reInit", onSelect).on("select", onSelect)
    return () => {
      api.off("reInit", onSelect).off("select", onSelect)
    }
  }, [api, onSelect])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])

  return (
    <CarouselContext.Provider
      value={{ carouselRef, orientation, scrollPrev, scrollNext, canScrollPrev, canScrollNext }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()
  return (
    // Fills the Carousel's height so a vertical viewport is as tall as its parent.
    <div ref={carouselRef} className="h-full overflow-hidden" data-slot="carousel-content">
      <div
        className={cn(
          "flex touch-pinch-zoom",
          orientation === "vertical" ? "h-full flex-col touch-pan-x" : "touch-pan-y",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-h-0 min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Previous slide"
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      className={cn(
        "absolute rounded-full",
        orientation === "vertical"
          ? "-top-12 left-1/2 -translate-x-1/2 rotate-90"
          : "top-1/2 left-0 -translate-y-1/2",
        className
      )}
      {...props}
    >
      <ChevronLeft />
    </Button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Next slide"
      disabled={!canScrollNext}
      onClick={scrollNext}
      className={cn(
        "absolute rounded-full",
        orientation === "vertical"
          ? "-bottom-12 left-1/2 -translate-x-1/2 rotate-90"
          : "top-1/2 right-0 -translate-y-1/2",
        className
      )}
      {...props}
    >
      <ChevronRight />
    </Button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
export type { CarouselApi }
