"use server";

interface GeoapifyFeature {
  properties?: {
    city?: string;
  };
}

interface GeoapifyAutocompleteResponse {
  features?: GeoapifyFeature[];
}

export async function searchCities(query: string, countryCode: string): Promise<string[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url =
    `https://api.geoapify.com/v1/geocode/autocomplete` +
    `?text=${encodeURIComponent(trimmed)}` +
    `&type=city` +
    `&filter=countrycode:${encodeURIComponent(countryCode.toLowerCase())}` +
    `&apiKey=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GeoapifyAutocompleteResponse;
  const cities = (data.features ?? [])
    .map((feature) => feature.properties?.city)
    .filter((city): city is string => Boolean(city));

  return Array.from(new Set(cities));
}
