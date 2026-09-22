/** Case- and diacritic-insensitive form of `text`, for search matching. */
export function normalizeSearchText(text: string): string {
  return text
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
