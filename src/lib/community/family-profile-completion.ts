/**
 * Shared utility: calculate family member profile completion percentage.
 *
 * Weights (must sum to 100):
 *   full_name      20%
 *   date_of_birth  15%
 *   birth_time     15%  (counts if value is set OR birth_time_unknown is true)
 *   birth_city     15%
 *   birth_country  15%
 *   relationship   10%
 *   natal_chart    10%
 */

export type FamilyProfileInput = {
  full_name?: string | null;
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_time_unknown?: boolean | null;
  birth_city?: string | null;
  birth_country?: string | null;
  relationship?: string | null;
  natal_chart?: object | null;
};

export type CompletionResult = {
  percent: number;
  missing: string[];
};

const WEIGHTS: Array<{
  key: keyof FamilyProfileInput | "natal_chart";
  label: string;
  pct: number;
  check: (m: FamilyProfileInput) => boolean;
}> = [
  {
    key: "full_name",
    label: "Full name",
    pct: 20,
    check: (m) => Boolean(m.full_name?.trim()),
  },
  {
    key: "date_of_birth",
    label: "Date of birth",
    pct: 15,
    check: (m) => Boolean(m.date_of_birth),
  },
  {
    key: "birth_time",
    label: "Birth time (or mark unknown)",
    pct: 15,
    check: (m) => Boolean(m.birth_time) || Boolean(m.birth_time_unknown),
  },
  {
    key: "birth_city",
    label: "Birth city",
    pct: 15,
    check: (m) => Boolean(m.birth_city?.trim()),
  },
  {
    key: "birth_country",
    label: "Birth country",
    pct: 15,
    check: (m) => Boolean(m.birth_country?.trim()),
  },
  {
    key: "relationship",
    label: "Relationship",
    pct: 10,
    check: (m) => Boolean(m.relationship?.trim()),
  },
  {
    key: "natal_chart",
    label: "Natal chart generated",
    pct: 10,
    check: (m) => m.natal_chart != null,
  },
];

export function calcFamilyProfileCompletion(
  member: FamilyProfileInput
): CompletionResult {
  let percent = 0;
  const missing: string[] = [];

  for (const item of WEIGHTS) {
    if (item.check(member)) {
      percent += item.pct;
    } else {
      missing.push(item.label);
    }
  }

  return { percent, missing };
}

export { WEIGHTS as FAMILY_COMPLETION_WEIGHTS };
