function normalizePlacePart(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function formatBirthPlace(
  birthCity?: string | null,
  birthCountry?: string | null,
): string {
  const city = birthCity?.trim() ?? "";
  const country = birthCountry?.trim() ?? "";

  if (!city) return country;
  if (!country) return city;

  const normalizedCity = normalizePlacePart(city);
  const normalizedCountry = normalizePlacePart(country);

  // Legacy rendering appended birth_country unconditionally. City autocomplete
  // labels can already include the country, so avoid displaying it twice.
  if (
    normalizedCity === normalizedCountry ||
    normalizedCity.endsWith(`, ${normalizedCountry}`)
  ) {
    return city;
  }

  return `${city}, ${country}`;
}
