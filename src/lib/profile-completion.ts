export type ProfileCompletionField = {
  key: string;
  label: string;
  value: unknown;
};

export type ProfileCompletionResult = {
  percentage: number;
  missingFields: Array<{
    key: string;
    label: string;
  }>;
  completedCount: number;
  totalCount: number;
};

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

export function calculateProfileCompletion(
  fields: ProfileCompletionField[]
): ProfileCompletionResult {
  const missingFields = fields
    .filter((field) => !hasValue(field.value))
    .map(({ key, label }) => ({ key, label }));

  const totalCount = fields.length;
  const completedCount = totalCount - missingFields.length;
  const percentage =
    totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

  return {
    percentage,
    missingFields,
    completedCount,
    totalCount,
  };
}

// ─── Community profile — single source of truth ──────────────────────────────
//
// These are the "Profile Details" fields measured by the bar on
// /community/profile. The Dashboard's "Journey Progress" card
// (ProfileCompletionCard on /community) measures a DIFFERENT, broader
// checklist (photo, birth data bundle, natal chart, family, relationship
// chart) — the two bars are intentionally not the same metric and are
// labeled differently in the UI.

export type CommunityProfileValues = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  birthTime: string;
  birthCity: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  occupation: string;
};

/**
 * Key used as the DOM id of each field's <Input>. Clicking a "missing"
 * chip scrolls to this id. Keep keys stable — Profile page `focusField()`
 * passes them to `document.getElementById`.
 */
export const COMMUNITY_PROFILE_FIELD_KEYS = {
  firstName: "community-first-name",
  lastName: "community-last-name",
  phone: "community-phone",
  gender: "community-gender",
  dateOfBirth: "community-dob",
  birthTime: "community-birth-time",
  birthCity: "community-birth-city",
  address: "community-address",
  city: "community-city",
  state: "community-state",
  zip: "community-zip",
  occupation: "community-occupation",
} as const;

/**
 * Build the canonical field list for the Community "Profile Details"
 * completion bar. Any new mandatory profile field must be added here ONLY —
 * consumers (profile-form.tsx + any future data-focused check) read this list.
 */
export function getCommunityProfileFields(
  values: CommunityProfileValues
): ProfileCompletionField[] {
  return [
    { key: COMMUNITY_PROFILE_FIELD_KEYS.firstName, label: "First name", value: values.firstName },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.lastName, label: "Last name", value: values.lastName },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.phone, label: "Phone", value: values.phone },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.gender, label: "Gender", value: values.gender },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.dateOfBirth, label: "Birth date", value: values.dateOfBirth },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.birthTime, label: "Birth time", value: values.birthTime },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.birthCity, label: "Birth city", value: values.birthCity },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.address, label: "Address", value: values.address },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.city, label: "City", value: values.city },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.state, label: "State", value: values.state },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.zip, label: "ZIP code", value: values.zip },
    { key: COMMUNITY_PROFILE_FIELD_KEYS.occupation, label: "Occupation", value: values.occupation },
  ];
}
