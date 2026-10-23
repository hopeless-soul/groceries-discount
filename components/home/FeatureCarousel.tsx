"use client"

import * as React from "react"
import { Heart, QrCode, ShoppingCart, Store } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "cn"

const AUTOPLAY_MS = 4000
const SLIDE_COUNT = 3

const FEATURES = [
  { icon: Store, title: "Discounts aggregator" },
  { icon: ShoppingCart, title: "Favorite list" },
  { icon: QrCode, title: "Loyalty cards storage" },
  { icon: Heart, title: "Everything in one place" },
]

// Store logos only: each card is named for screen readers but shows no text.
const STORES = [
  { key: "lidl", name: "Lidl", src: "/stores/lidl-tile.png" },
  { key: "kaufland", name: "Kaufland", src: "/stores/kaufland-tile.png" },
  { key: "billa", name: "Billa", src: "/stores/billa-tile.png" },
  { key: "tesco", name: "Tesco", src: "/stores/tesco-tile.png" },
]

const STEPS = [
  "Pick the stores you shop at",
  "Browse and filter this week's offers",
  "Add the deals you want to your favorite list",
  "Save loyalty cards and show the QR code",
]

export function FeatureCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selected, setSelected] = React.useState(0)
  const [hovered, setHovered] = React.useState(false)

  React.useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on("select", onSelect)
    // Deferred so the initial sync isn't a synchronous setState in the effect body.
    queueMicrotask(onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api])

  // Always cycling. Pauses only while the mouse is over the carousel, and respects reduced motion.
  React.useEffect(() => {
    if (!api || hovered) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = window.setInterval(() => api.scrollNext(), AUTOPLAY_MS)
    return () => window.clearInterval(id)
    // `selected` restarts the countdown whenever the slide changes, including manual swipes and dots.
  }, [api, hovered, selected])

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") api?.scrollNext()
    if (event.key === "ArrowLeft") api?.scrollPrev()
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      aria-label="Features"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={onKeyDown}
      className="mx-auto w-full max-w-[600px] px-4 sm:px-5"
    >
      <CarouselContent>
        <CarouselItem>
          <div className="mx-auto grid w-full max-w-[260px] grid-cols-2 gap-2 select-none">
            {FEATURES.map(({ icon: Icon, title }) => (
              <div
                key={title}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[10px] bg-zinc-900 p-3 text-center"
              >
                <Icon className="size-[30px] text-zinc-50 sm:size-9" strokeWidth={1.5} aria-hidden />
                <h3 className="font-[family-name:var(--font-display)] text-xs leading-tight font-medium text-zinc-50">
                  {title}
                </h3>
              </div>
            ))}
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="mx-auto flex w-fit flex-col">
            <h3 className="mb-6 text-center font-[family-name:var(--font-display)] text-xl font-normal text-zinc-900">
              How to use it
            </h3>
            <ol className="grid max-w-[280px] gap-3 sm:max-w-[420px]">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-zinc-900 text-xs font-medium text-zinc-50">
                    {index + 1}
                  </span>
                  <span className="text-start text-sm font-medium text-zinc-900 sm:whitespace-nowrap sm:text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </CarouselItem>
        <CarouselItem>
          <div className="mx-auto grid w-full max-w-[260px] grid-cols-[repeat(2,minmax(0,1fr))] gap-2">
            {STORES.map(({ key, name, src }) => (
              <div
                key={key}
                className="flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-[10px] bg-white ring-1 ring-zinc-200"
              >
                <img src={src} alt={name} className="size-full object-contain" />
              </div>
            ))}
          </div>
        </CarouselItem>
      </CarouselContent>

      <div className="mt-4 flex items-center justify-center gap-1">
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show slide ${index + 1} of ${SLIDE_COUNT}`}
            aria-current={selected === index}
            onClick={() => api?.scrollTo(index)}
            className="flex size-6 items-center justify-center"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all",
                selected === index ? "w-4 bg-zinc-900" : "w-1.5 bg-zinc-300",
              )}
            />
          </button>
        ))}
      </div>
    </Carousel>
  )
}
