import { COUNTRY_CURRENCY, getDomain, httpGet, STORE_CODE_RE, type HttpGetOptions } from "./common.js";
import { UpstreamError, ValidationError } from "./errors.js";
import type { Category, DiscountsResponse, Offer } from "./types.js";

/** Raw shape of one offer inside a category's `offers[]` -- see docs/api-reference.md §3. */
interface RawOffer {
  offerId?: string;
  klNr?: string;
  title?: string;
  subtitle?: string;
  unit?: string;
  price?: number;
  formattedOldPrice?: string;
  discount?: number;
  basePrice?: string;
  formattedBasePrice?: string;
  dateFrom?: string;
  dateTo?: string;
  label?: string;
  loyaltyDiscount?: number;
  listImage?: string;
}

interface RawCategory {
  offerCategoryId?: string;
  displayName?: string;
  dateFrom?: string;
  dateTo?: string;
  main?: boolean;
  order?: string;
  offers?: RawOffer[];
}

interface RawCycle {
  categories?: RawCategory[];
}

interface OfferTemplateProps {
  weekData?: { currentWeekDates?: string[]; nextWeekDates?: string[] };
  offerData?: { cycles?: RawCycle[] };
}

interface OfferTemplate {
  component: "OfferTemplate";
  props?: OfferTemplateProps;
}

/**
 * Brace-counting scan (not a regex) to isolate one JSON value starting at `text[start]`,
 * which must be `{`. A naive `\{.*?\}` regex truncates early because the payload is deeply
 * nested and contains `}` inside strings well before the real end -- see
 * docs/api-reference.md §3 "Extracting the payload".
 */
function extractJsonValue(text: string, start: number): { data: unknown; end: number } {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === "{") {
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          break;
        }
      }
    }
    i += 1;
  }
  return { data: JSON.parse(text.slice(start, i)), end: i };
}

/** Locate and parse the `window.SSR['<uuid>'] = {"component":"OfferTemplate",...}` block. */
export function extractOfferTemplate(html: string): OfferTemplate {
  const marker = "window.SSR['";
  let pos = 0;
  while (true) {
    const idx = html.indexOf(marker, pos);
    if (idx === -1) break;
    const eqIdx = html.indexOf("] = ", idx);
    if (eqIdx === -1) break;
    const start = eqIdx + 4;
    const { data, end } = extractJsonValue(html, start);
    if ((data as { component?: string })?.component === "OfferTemplate") {
      return data as OfferTemplate;
    }
    pos = end;
  }
  throw new UpstreamError("Could not find an OfferTemplate window.SSR block in the offers page");
}

function parseOldPrice(rawOffer: RawOffer): number | null {
  const text = rawOffer.formattedOldPrice;
  if (!text) return null;
  const value = Number.parseFloat(text.replace(",", "."));
  return Number.isNaN(value) ? null : value;
}

export function buildDiscountsResponse(
  storeCode: string,
  props: OfferTemplateProps,
): DiscountsResponse {
  const weekData = props.weekData ?? {};
  const currency = COUNTRY_CURRENCY[storeCode.slice(0, 2)] ?? "EUR";

  const offers: Offer[] = [];
  const categories: Category[] = [];

  for (const cycle of props.offerData?.cycles ?? []) {
    for (const category of cycle.categories ?? []) {
      const categoryId = category.offerCategoryId ?? "";
      const categoryName = category.displayName ?? "";
      const categoryOffers = category.offers ?? [];

      categories.push({
        category_id: categoryId,
        category_name: categoryName,
        valid_from: category.dateFrom ?? null,
        valid_to: category.dateTo ?? null,
        main: category.main ?? null,
        order: category.order ?? null,
        offer_count: categoryOffers.length,
      });

      for (const raw of categoryOffers) {
        offers.push({
          offer_id: raw.offerId ?? "",
          article_number: raw.klNr ?? "",
          store_code: storeCode,
          title: raw.title ?? "",
          subtitle: raw.subtitle ?? null,
          unit: raw.unit ?? "",
          price: raw.price ?? 0,
          old_price: parseOldPrice(raw),
          currency,
          discount_percent: raw.discount ?? null,
          base_price_text: raw.basePrice ?? raw.formattedBasePrice ?? null,
          valid_from: raw.dateFrom ?? "",
          valid_to: raw.dateTo ?? "",
          category_id: categoryId,
          category_name: categoryName,
          label: raw.label ?? null,
          loyalty_discount: raw.loyaltyDiscount ?? 0,
          image_url: raw.listImage ?? null,
        });
      }
    }
  }

  return {
    store_code: storeCode,
    fetched_at: new Date().toISOString(),
    week: {
      current_week_dates: weekData.currentWeekDates ?? [],
      next_week_dates: weekData.nextWeekDates ?? [],
    },
    category_count: categories.length,
    categories,
    offer_count: offers.length,
    offers,
  };
}

/** Given a store code, fetch that store's full current-week discount list. */
export async function fetchDiscounts(
  storeCode: string,
  httpOptions: HttpGetOptions = {},
): Promise<DiscountsResponse> {
  const code = storeCode.toUpperCase();
  if (!STORE_CODE_RE.test(code)) {
    throw new ValidationError(`Invalid store code: '${code}' (expected format like 'SK3920')`);
  }
  const domain = getDomain(code.slice(0, 2));
  const url = `https://${domain}/aktualna-ponuka/prehlad.html`;
  const html = await httpGet(url, { ...httpOptions, cookies: { "x-aem-variant": code } });
  const template = extractOfferTemplate(html);
  return buildDiscountsResponse(code, template.props ?? {});
}
