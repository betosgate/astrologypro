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
