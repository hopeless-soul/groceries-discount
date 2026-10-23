import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"
import { AnimatedHeadline } from "@/components/home/AnimatedHeadline"
import { BrandLogo } from "@/components/home/BrandLogo"
import { CountryFlag } from "@/components/home/CountryFlag"
import { FeatureCarousel } from "@/components/home/FeatureCarousel"

export function HomePage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background font-[family-name:var(--font-home-body)] text-zinc-900">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
        <section className="flex w-full flex-col items-center gap-4 px-4 sm:px-5">
          {/* mb-1 + the section's gap-4 = 20px, the lockup's clear space of one cap height */}
          <BrandLogo className="mb-1" />
          <AnimatedHeadline className="max-w-[640px] text-balance font-[family-name:var(--font-display)] text-[28px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-[40px]">
            Your grocery discounts, sorted and ready to shop.
          </AnimatedHeadline>
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700">
            <CountryFlag code="SK" />
            <span>Slovakia</span>
            {/* <CountryFlag code="CZ" />
            <span>Czechia</span> */}
          </p>
        </section>

        <section className="w-full">
          <FeatureCarousel />
        </section>

        <section className="w-full px-4 sm:px-5">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-[52px] w-full max-w-80 rounded-[14px] bg-zinc-900 text-base font-normal text-zinc-50 shadow-[0_10px_20px_rgb(24_24_27/0.2)] hover:bg-zinc-800",
            )}
          >
            Get started
          </Link>
        </section>
      </main>

      <footer className="w-full border-t border-border bg-white px-4 py-3 text-center text-xs text-zinc-600 sm:px-5">
        Offers are provided by each store and may change.
      </footer>
    </div>
  )
}
