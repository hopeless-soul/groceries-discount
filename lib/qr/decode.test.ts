import { beforeEach, describe, expect, it, vi } from "vitest";

const readBarcodes = vi.fn();
vi.mock("zxing-wasm/reader", () => ({ readBarcodes }));

import { decodeImageBlob } from "./decode";

beforeEach(() => readBarcodes.mockReset());

describe("decodeImageBlob", () => {
  it("returns the text of the first valid result", async () => {
    readBarcodes.mockResolvedValue([
      { isValid: false, text: "bad" },
      { isValid: true, text: "634009509005331837" },
    ]);
    await expect(decodeImageBlob(new Blob(["x"]))).resolves.toBe("634009509005331837");
  });

  it("throws when nothing was found", async () => {
    readBarcodes.mockResolvedValue([]);
    await expect(decodeImageBlob(new Blob(["x"]))).rejects.toThrow("No code found");
  });
});
