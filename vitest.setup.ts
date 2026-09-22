import "@testing-library/jest-dom/vitest";
import { setDesktop } from "@/lib/test-utils/matchMedia";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// jsdom reports 0 for layout metrics, which makes @tanstack/react-virtual
// compute a zero-height viewport and render no rows. Give elements a
// plausible size so virtualized lists render a realistic window in tests.
if (typeof HTMLElement !== "undefined") {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    value: 800,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
}

setDesktop(true);
