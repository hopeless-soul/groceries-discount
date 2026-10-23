"use client"

import * as React from "react"
import { animate, splitText, stagger } from "animejs"

// Words rise in one after another on mount. Skipped when the user prefers reduced motion.
function AnimatedHeadline({
  children,
  className,
  as: Tag = "h1",
}: {
  children: string
  className?: string
  as?: "h1" | "span"
}) {
  const ref = React.useRef<HTMLHeadingElement & HTMLSpanElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const split = splitText(el, { words: true })
    const animation = animate(split.words, {
      y: ["0.4em", "0em"],
      opacity: [0, 1],
      duration: 750,
      delay: stagger(60),
      ease: "out(3)",
    })

    return () => {
      animation.revert()
      split.revert()
    }
  }, [])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

export { AnimatedHeadline }
