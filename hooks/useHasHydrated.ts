"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `false` on the server and during the client's first (hydrating)
 * render, then `true` on every render after that. Use this to gate any render
 * logic that depends on client-only state (e.g. localStorage-backed stores)
 * so the client's first render always matches the server-rendered HTML,
 * avoiding a hydration mismatch.
 *
 * Implemented with `useSyncExternalStore` (server snapshot `false`, client
 * snapshot `true`) rather than a `useEffect` + `setState` pair: React's
 * built-in mechanism for reconciling a value that legitimately differs
 * between server and client render, with no risk of cascading-render lint
 * warnings from calling `setState` inside an effect body.
 */
export function useHasHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
