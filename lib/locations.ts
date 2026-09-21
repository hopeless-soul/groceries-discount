export interface Country {
  name: string;
  code: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  {
    name: "Slovakia",
    code: "SK",
    cities: [
      "Bratislava",
      "Kosice",
      "Presov",
      "Zilina",
      "Nitra",
      "Trnava",
      "Dubnica nad Vahom",
    ],
  },
];

export function getCitiesForCountry(code: string): string[] {
  return COUNTRIES.find((country) => country.code === code)?.cities ?? [];
}
