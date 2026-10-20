import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import Page from "./page";

beforeEach(() => {
  redirect.mockClear();
});

describe("Home page", () => {
  it("redirects straight to /dashboard", () => {
    Page();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
