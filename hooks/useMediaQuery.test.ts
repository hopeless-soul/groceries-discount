import { afterEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMediaQuery } from "./useMediaQuery";
import { setDesktop } from "@/lib/test-utils/matchMedia";

afterEach(() => setDesktop(true));

describe("useMediaQuery", () => {
  it("returns true when the query matches", () => {
    setDesktop(true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(true);
  });

  it("returns false when the query does not match", () => {
    setDesktop(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));
    expect(result.current).toBe(false);
  });
});
