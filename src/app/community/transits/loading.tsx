export default function TransitsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      </div>

      {/* CTA card skeleton */}
      <div className="h-20 rounded-xl border bg-card animate-pulse" />

      {/* Transit cards skeleton */}
      {[1, 2].map((i) => (
        <div key={i} className="h-64 rounded-xl border bg-card animate-pulse" />
      ))}
    </div>
  );
}
