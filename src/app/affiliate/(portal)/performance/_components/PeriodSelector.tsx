"use client";

const OPTIONS = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "365d", label: "365d" },
  { value: "all", label: "All" },
];

/**
 * Toggle for the standard analytics period filter.
 * Sprint: docs/tasks/2026-05-05/affiliate-analytics-phase-3/01-affiliate-performance.md
 */
export function PeriodSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 text-sm">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded px-3 py-1 ${
            value === o.value
              ? "bg-zinc-900 text-white"
              : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
