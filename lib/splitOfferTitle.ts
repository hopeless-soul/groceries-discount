/**
 * splitOfferTitle — turns a raw leaflet title into a short display title
 * (brand + product) and an optional subtitle (size, pack, fat/alcohol %,
 * variants, storage state, extra descriptors).
 *
 *   "Kuracie stehná XXL cena za 1 kg horné/dolné"
 *     → { displayTitle: "Kuracie stehná XXL", displaySubtitle: "za 1 kg · horné/dolné" }
 *   "Bravčový bôčik cena za 1 kg bez kosti s kožou"
 *     → { displayTitle: "Bravčový bôčik bez kosti s kožou", displaySubtitle: "za 1 kg" }
 *   "Coca-Cola, Fanta, Sprite 1,5 l"
 *     → { displayTitle: "Coca-Cola, Fanta, Sprite", displaySubtitle: "1,5 l" }
 *   "Tmavé hrozno" → { displayTitle: "Tmavé hrozno", displaySubtitle: null }
 *
 * How it works
 *  1. Clean: drop footnote asterisks, unit-price parentheses "(1 kg = 2,38)",
 *     trailing dots, and collapse whitespace.
 *  2. Scan the title for "detail markers": quantities, multipacks, ranges,
 *     dimensions, percentages, clothing sizes, ply counts, variant phrases
 *     ("rôzne druhy"), storage state ("chladené", "mrazené"), sales noise
 *     ("voľný predaj", "balené") and ", " separators.
 *  3. The first marker that is not the first word is the split point.
 *     Everything before it is the title; a ", " is skipped when it separates
 *     brand names ("Pepsi, Mirinda, 7UP").
 *  4. The rest is cut into chips: each marker becomes a normalised chip (or is
 *     dropped if it's noise), the text between markers becomes free-text chips.
 *  5. Prepositional free text right after a quantity ("s kožou",
 *     "bez kosti") describes the product itself, so it goes back to the title.
 *  6. Chips are de-duplicated and joined with " · ".
 */

export interface SplitTitle {
  displayTitle: string;
  displaySubtitle: string | null;
}

export interface SplitOptions {
  /** Max length of the title after re-attaching prepositional phrases. */
  maxMergedTitleLength?: number;
  /** Chip separator in the subtitle. */
  separator?: string;
}

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

/** 0,5 · 1.5 · 250 · "1 000" (thousands separated by a space). */
const NUM = String.raw`(?:\d{1,3}(?: \d{3})+(?![\d.,])|\d+(?:[.,]\d+)?)`;

/** Units — longer alternatives first so "kg" wins over "g", "kusov" over "kus". */
const UNIT = String.raw`(?:kg|dkg|mg|g|ml|cl|dl|l|ks|kusov|kusy|kus|páry|pár|praní|PD|dávok|dávky|rolí|rolky|rolka|rola|kotúčikov|útržkov|zväzky|zväzok|balení|balenie|mm|cm|Ah|A|V|W)`;

/** A unit may not be glued to a letter/digit ("5W-30", "250 A1", "1 kusom"). */
const UNIT_END = String.raw`(?![\p{L}\d]|-\d)`;

/** A number may not continue a code like "L-1", "S-10", "4v1", "0,5". */
const NUM_START = String.raw`(?<![\p{L}\d.,/]|[\p{L}\d]-)`;

/** Core quantity: optional multipack "8 x", ranges "35 - 50 g", "53 g – 58 g", "295/300 g". */
const QTY_CORE =
  String.raw`(?:\d+\s*[x×]\s*)?` +
  String.raw`(?:${NUM}(?:\s*${UNIT})?\s*[-–/]\s*)*` +
  String.raw`${NUM}\s*${UNIT}${UNIT_END}`;

interface Rule {
  type: ChipType;
  re: string;
}

type ChipType =
  | "comma"
  | "drop"
  | "promo"
  | "firm"
  | "perUnit"
  | "temp"
  | "age"
  | "qty"
  | "dim"
  | "percent"
  | "size"
  | "ply"
  | "variant"
  | "state"
  | "piece"
  | "noise";

/**
 * Order matters only when two rules match at the same position
 * (e.g. "promo" must beat "qty" on "400 + 40 g navýše").
 */
const RULES: Rule[] = [
  { type: "comma", re: String.raw`,(?=\s|$)` },
  // unit-price parentheses — shown elsewhere in the UI
  { type: "drop", re: String.raw`\(\s*1\s*(?:kg|l|ks)\s*=\s*[\d.,\s]+(?:€|eur)?\s*\)` },
  { type: "promo", re: String.raw`${NUM_START}${NUM}\s*${UNIT}?\s*\+\s*${NUM}\s*${UNIT}${UNIT_END}(?:\s*(?:navýše|navyše|zdarma))?` },
  { type: "firm", re: String.raw`pevný podiel\s*${QTY_CORE}` },
  { type: "perUnit", re: String.raw`cena za\s*${QTY_CORE}` },
  { type: "temp", re: String.raw`[-+]?\d+\s*°C` },
  { type: "age", re: String.raw`${NUM_START}\d+\s*[-–]\s*\d+\s*rokov|od\s+\d+\s*rokov` },
  {
    type: "qty",
    re:
      String.raw`(?:(?:priemer|cca\.?|približne)\s+)?${NUM_START}${QTY_CORE}` +
      String.raw`(?:\s*\/\s*1\s*bal\.)?` + // "8 ks/1 bal."
      String.raw`(?:\s*=\s*${NUM}\s*${UNIT}${UNIT_END})?`, // "8 x 0,5 l = 4 l"
  },
  // dimensions without unit: "90 x 200", "70 x 140 x 10", "90 - 100 x 200 cm"
  { type: "dim", re: String.raw`${NUM_START}\d+(?:\s*[-–]\s*\d+)?\s*[x×]\s*\d+(?:\s*[x×]\s*\d+)?(?:\s*(?:cm|mm))?(?![\d.,])` },
  // fat / alcohol content; "100 %" and "0,0 %" are excluded on purpose — they are part of the
  // product name ("100% šťava", "Budvar 0,0%")
  {
    type: "percent",
    re: String.raw`(?:max\.\s*)?${NUM_START}(?:${NUM}\s*[-–]\s*)?(?!(?:100|0(?:[.,]0)?)\s*%)${NUM}\s*%(?:\s*alk\.)?(?:\s*tuku)?`,
  },
  {
    type: "size",
    re: String.raw`(?:(?:dámsk\p{L}*(?:\s+alebo\s+pánsk\p{L}*)?|pánsk\p{L}*)\s+)?(?:ve[lľ]\.\s*:?|veľkosť)\s*[\p{L}\d/]+(?:\s*[-–]\s*[\p{L}\d/]+)?`,
  },
  { type: "ply", re: String.raw`\d+-vrstvov\p{L}*` },
  {
    type: "variant",
    re: String.raw`(?:r[oô]zne|různ[eé]|vybrané)\s+(?:druhy|farby|príchute)|viac\s+druhov|${NUM_START}\d+\s+druhy(?!\p{L})`,
  },
  { type: "state", re: String.raw`(?<!\p{L})(?:hlbokozmrazen|zmrazen|mrazen|chladen)\p{L}*` },
  // a lone "kus"/"zväzok" (sold per piece/bunch) — "Ľadový šalát kus", "Reďkovky zväzok".
  // "1 kus" is consumed earlier by "qty" because it starts further left.
  { type: "piece", re: String.raw`(?<![\p{L}\d])(?:kus|zväzok)(?!\p{L})` },
  {
    type: "noise",
    re: String.raw`(?<!\p{L})(?:voľn\p{L}* predaj|pultov\p{L}* predaj|v balení|balen[éáý]|balenie|voľn[éáý])(?!\p{L})`,
  },
];

const COMBINED = new RegExp(RULES.map((r) => `(${r.re})`).join("|"), "gu");

/** Prepositions that start a phrase describing the product itself. */
const PREPOSITION_START = /^(?:s|so|z|zo|bez|v|vo|na|pre)\s/u;

/** Antonym pairs that read better as "a/b" than as two chips. */
const ANTONYMS: Array<[string, string]> = [
  ["horné", "dolné"],
  ["biele", "červené"],
  ["mliečna", "horká"],
  ["údené", "neúdené"],
];

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

interface Match {
  type: ChipType;
  start: number;
  end: number;
  text: string;
}

interface Chip {
  type: ChipType | "text";
  text: string;
  /** free text that directly follows a quantity-like chip (no comma between) */
  followsQuantity?: boolean;
}

function findMarkers(s: string): Match[] {
  const out: Match[] = [];
  COMBINED.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COMBINED.exec(s))) {
    if (m[0].length === 0) {
      COMBINED.lastIndex++;
      continue;
    }
    const groupIdx = m.slice(1).findIndex((g) => g !== undefined);
    out.push({ type: RULES[groupIdx].type, start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

function clean(raw: string): string {
  return raw
    .replace(/\*+/g, "") // footnote marks: "40 %**", "*Pečené"
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim()
    .replace(/[,;:]+$/u, "")
    .replace(/(?<!\p{Lu}|bal)\.$/u, "") // trailing "." of "250 g." (keep "D.O.C.", "1 bal.")
    .trim();
}

function trimPunct(s: string): string {
  return s
    .replace(/^[\s,;:.]+/u, "")
    .replace(/(?:[\s,;:\-–]|(?<!\p{Lu})\.)+$/u, "") // keep the dot of "D.O.C."
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalises numbers/units inside a chip. */
function formatQuantity(s: string): string {
  return s
    .replace(/\s*\/\s*1\s*bal\./u, "")
    .replace(/^cca\.?\s*/u, "cca ")
    .replace(/(\d)(?=\p{L})(?!v\d)/gu, "$1 ") // "500g" → "500 g"
    .replace(/(\d)\s*[x×]\s*(?=\d)/gu, "$1 × ")
    .replace(/(\d[\d,.]*)\s*(\p{L}+)\s*[-–]\s*(\d[\d,.]*)\s*\2(?!\p{L})/gu, "$1 – $3 $2") // "53 g – 58 g" → "53 – 58 g"
    .replace(/(\d)\s*[-–]\s*(?=\d)/gu, "$1 – ")
    .replace(/\s*=\s*(.+)$/u, " ($1)")
    .replace(/\b(\d[\d ,.]*)\s*(kusov|kusy|kus)(?!\p{L})/gu, "$1 ks")
    .replace(/(\d)\s*PD\b/gu, "$1 praní")
    .replace(/(\d)\s*%/gu, "$1 %")
    .replace(/navýše/u, "navyše")
    .replace(/\s+/g, " ")
    .trim();
}

function formatChip(m: Match): Chip | null {
  switch (m.type) {
    case "drop":
    case "noise":
    case "comma":
      return null;
    case "perUnit":
      return { type: m.type, text: formatQuantity(m.text.replace(/^cena\s+za\s*/u, "za ")) };
    case "piece":
      return { type: m.type, text: m.text === "kus" ? "1 ks" : `1 ${m.text}` };
    case "size":
      return { type: m.type, text: m.text.replace(/\s*([-–])\s*/gu, " – ").replace(/\s+/g, " ") };
    case "state":
    case "variant":
    case "ply":
      return { type: m.type, text: m.text.trim() };
    default:
      return { type: m.type, text: formatQuantity(m.text) };
  }
}

const QUANTITY_LIKE = new Set<Chip["type"]>(["qty", "perUnit", "promo", "firm", "dim", "piece", "percent"]);

/** "Coca-Cola" + ", Fanta" — a comma between proper names is part of the title. */
function isNameList(head: string, segment: string): boolean {
  const words = (x: string) => x.split(/[\s/]+/u).filter(Boolean);
  const nameLike = (w: string) => /^[\p{Lu}\d]/u.test(w) || w === "&";
  const seg = words(segment);
  return seg.length > 0 && seg.length <= 3 && words(head).every(nameLike) && seg.every(nameLike);
}

function pickSplitPoint(s: string, markers: Match[]): number {
  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i];
    const head = trimPunct(s.slice(0, mk.start));
    if (!/\p{L}/u.test(head)) continue; // marker is the first word ("Mrazený hrášok")
    if (mk.type === "state" || mk.type === "noise") {
      // "chladené"/"balené" only end the name when nothing but other markers follow:
      // "Wrap hot strips chladené 175 g" splits, "Ristorante mrazená pizza Prosciutto" does not.
      const next = markers[i + 1];
      const gap = s.slice(mk.end, next ? next.start : s.length);
      if (!/^[\s,.;:]*$/u.test(gap)) continue;
    }
    if (mk.type === "comma") {
      const next = markers[i + 1];
      const segment = trimPunct(s.slice(mk.end, next ? next.start : s.length));
      if (isNameList(head, segment)) continue;
    }
    return mk.start;
  }
  return -1;
}

/** Splits the tail into ordered chips. */
function tailToChips(tail: string, tailOffset: number, markers: Match[]): Chip[] {
  const chips: Chip[] = [];
  let cursor = 0;
  let afterComma = false;
  let prevQuantityLike = false;

  const pushText = (text: string) => {
    // free text between markers: split on ", " (comma markers already consumed)
    const t = trimPunct(text);
    if (!t) return;
    chips.push({ type: "text", text: t, followsQuantity: prevQuantityLike && !afterComma });
    prevQuantityLike = false;
  };

  for (const mk of markers) {
    const start = mk.start - tailOffset;
    const end = mk.end - tailOffset;
    if (start < 0) continue;
    pushText(tail.slice(cursor, start));
    if (mk.type === "comma") {
      afterComma = true;
      prevQuantityLike = false;
    } else {
      const chip = formatChip(mk);
      if (chip) {
        chips.push(chip);
        prevQuantityLike = QUANTITY_LIKE.has(chip.type);
        afterComma = false;
      }
      // noise ("voľný predaj", "balené") is transparent: keeps prevQuantityLike/afterComma
    }
    cursor = end;
  }
  pushText(tail.slice(cursor));
  return chips;
}

/** "údený, neúdený" / "horné, dolné" → "údený/neúdený" as one chip. */
function foldAdjectivePair(head: string, chips: Chip[], splitWasComma: boolean): { head: string; chips: Chip[] } {
  if (!splitWasComma || chips.length === 0 || chips[0].type !== "text") return { head, chips };
  const headWords = head.split(" ");
  if (headWords.length < 2) return { head, chips };
  const last = headWords[headWords.length - 1];
  const [first, ...restWords] = chips[0].text.split(" ");
  const adj = /^\p{Ll}+[ýéáí]$/u;
  if (!adj.test(last) || !adj.test(first)) return { head, chips };

  const isPair =
    first === `ne${last}` ||
    ANTONYMS.some(([a, b]) => (a === last && b === first) || (b === last && a === first));
  const newHead = headWords.slice(0, -1).join(" ");
  const folded: Chip[] = isPair
    ? [{ type: "variant", text: `${last}/${first}` }]
    : [{ type: "text", text: last }, { type: "text", text: first }];
  const rest = restWords.join(" ");
  return { head: newHead, chips: [...folded, ...(rest ? [{ ...chips[0], text: rest }] : []), ...chips.slice(1)] };
}

export function splitOfferTitle(rawTitle: string, options: SplitOptions = {}): SplitTitle {
  const { maxMergedTitleLength = 55, separator = " · " } = options;

  const s = clean(rawTitle ?? "");
  if (!s) return { displayTitle: "", displaySubtitle: null };

  const markers = findMarkers(s);
  const splitAt = pickSplitPoint(s, markers);
  if (splitAt < 0) return { displayTitle: s, displaySubtitle: null };

  let head = trimPunct(s.slice(0, splitAt));
  const tail = s.slice(splitAt);
  const splitMarker = markers.find((m) => m.start === splitAt)!;
  let chips = tailToChips(tail, splitAt, markers.filter((m) => m.start >= splitAt));

  ({ head, chips } = foldAdjectivePair(head, chips, splitMarker.type === "comma"));

  // Prepositional phrases right after a quantity belong to the product name:
  // "Bravčový bôčik cena za 1 kg bez kosti s kožou" → "Bravčový bôčik bez kosti s kožou".
  const keep: Chip[] = [];
  for (const chip of chips) {
    if (
      chip.type === "text" &&
      chip.followsQuantity &&
      PREPOSITION_START.test(chip.text) &&
      head.length + 1 + chip.text.length <= maxMergedTitleLength
    ) {
      head = `${head} ${chip.text}`;
    } else {
      keep.push(chip);
    }
  }

  // "zväzok, 1 ks" → the bunch already says it's one piece.
  if (keep.some((c) => c.type === "piece" && c.text !== "1 ks")) {
    for (let i = keep.length - 1; i >= 0; i--) if (keep[i].type === "qty" && keep[i].text === "1 ks") keep.splice(i, 1);
  }

  // De-duplicate ("hlbokozmrazené mrazené" → one chip).
  const seen: string[] = [];
  const texts = keep
    .map((c) => c.text)
    .filter((t) => {
      const low = t.toLowerCase();
      if (seen.some((x) => x === low || (x.includes(low) && low.length > 3))) return false;
      seen.push(low);
      return true;
    });

  return {
    displayTitle: head || s,
    displaySubtitle: texts.length ? texts.join(separator) : null,
  };
}
