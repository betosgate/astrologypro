/**
 * Shared utility: calculate family member profile completion percentage.
 *
 * Weights (must sum to 100):
 *   full_name      20%
 *   date_of_birth  16%
 *   birth_time     16%  (counts if value is set OR birth_time_unknown is true)
 *   birth_city     16%
 *   birth_country  16%
 *   relationship   16%
 *
 * Natal chart generation is intentionally tracked separately from profile
 * completion so "Chart Pending" does not make a complete profile look
 * incomplete.
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
    pct: 16,
    check: (m) => Boolean(m.date_of_birth),
  },
  {
    key: "birth_time",
    label: "Birth time (or mark unknown)",
    pct: 16,
    check: (m) => Boolean(m.birth_time) || Boolean(m.birth_time_unknown),
  },
  {
    key: "birth_city",
    label: "Birth city",
    pct: 16,
    check: (m) => Boolean(m.birth_city?.trim()),
  },
  {
    key: "birth_country",
    label: "Birth country",
    pct: 16,
    check: (m) => Boolean(m.birth_country?.trim()),
  },
  {
    key: "relationship",
    label: "Relationship",
    pct: 16,
    check: (m) => Boolean(m.relationship?.trim()),
  },
  // Legacy: chart generation used to contribute 10% to profile completion.
  // Keep this commented out for traceability; chart status is shown separately.
  // {
  //   key: "natal_chart",
  //   label: "Natal chart generated",
  //   pct: 10,
  //   check: (m) => m.natal_chart != null,
  // },
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
