import { cn } from "cn"
import BascetLogo from "@/public/bascet_logo.svg"

// Same mark as the dashboard header (AppHeader), so the brand reads the same on both pages.
// Lockup rules, in units of the wordmark's cap height C (0.66em in Bricolage Grotesque):
// mark height 1.5C (~1em), gap 0.5C (~0.33em) from the mark's visible edge, clear space >= C around it.
// With leading-none the cap centre sits at the text box centre for this font, so items-center is optically correct.
// The viewBox crops the asset's empty 900px canvas down to the visible bag (x 159-729, y 122-801).
function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-[0.33em] text-[30px]", className)}>
      <BascetLogo aria-hidden="true" viewBox="159 122 571 680" className="h-[1em] w-[0.84em] shrink-0" />
      <span className="font-[family-name:var(--font-display)] leading-none font-medium tracking-[-0.03em] text-zinc-900">
        Basket
      </span>
    </div>
  )
}

export { BrandLogo }
