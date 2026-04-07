export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-28 rounded bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="h-64 rounded-xl border bg-card animate-pulse" />

      {/* Referrers skeleton */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-6 py-4 space-y-1">
          <div className="h-5 w-36 rounded bg-muted animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 rounded bg-muted animate-pulse"
              style={{ opacity: 1 - i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
