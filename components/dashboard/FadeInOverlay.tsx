"use client";

import * as React from "react";
import { animate } from "animejs";

// White veil over the dashboard that fades out on mount. Instant when the user prefers reduced motion.
function FadeInOverlay() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animation = animate(el, {
      opacity: [1, 0],
      duration: reduced ? 0 : 600,
      ease: "out(2)",
    });
    return () => {
      animation.revert();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 bg-white" />;
}

export { FadeInOverlay };
