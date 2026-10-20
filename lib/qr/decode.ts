export async function decodeImageBlob(blob: Blob): Promise<string> {
  // Dynamic import keeps the WASM reader out of the server render and the initial bundle.
  // shortcut: zxing-wasm fetches its .wasm from jsDelivr on first decode; self-host it via
  // prepareZXingModule({ overrides: { locateFile } }) if offline decoding is ever needed.
  const { readBarcodes } = await import("zxing-wasm/reader");
  const results = await readBarcodes(blob, { tryHarder: true, maxNumberOfSymbols: 1 });
  const text = results.find((r) => r.isValid)?.text;
  if (!text) throw new Error("No code found");
  return text;
}
