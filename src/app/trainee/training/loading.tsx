export default function TrainingLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-16 rounded-xl border bg-card animate-pulse" />
      </div>

      {/* Program cards grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-52 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
