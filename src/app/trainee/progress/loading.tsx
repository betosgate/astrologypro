export default function ProgressLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>

      {/* Module breakdown skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
