export default function ReadingsLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Fixed radial background gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_10%,rgba(201,120,28,0.15)_0%,transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_85%,rgba(201,168,76,0.09)_0%,transparent_55%)]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col">
        {/* Hero skeleton */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-4 text-center">
            {/* Badge pill */}
            <div className="mx-auto mb-6 h-7 w-48 animate-pulse rounded-full bg-white/[0.06]" />
            {/* H1 */}
            <div className="mx-auto mb-3 h-12 w-3/4 animate-pulse rounded-xl bg-white/[0.08]" />
            <div className="mx-auto mb-6 h-10 w-1/2 animate-pulse rounded-xl bg-white/[0.06]" />
            {/* Subtitle */}
            <div className="mx-auto mb-2 h-4 w-2/3 animate-pulse rounded bg-white/[0.04]" />
            <div className="mx-auto mb-10 h-4 w-1/2 animate-pulse rounded bg-white/[0.04]" />
            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center gap-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.06]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust bar skeleton */}
        <div className="border-y border-white/[0.06] bg-white/[0.015] px-4 py-4">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 w-32 animate-pulse rounded bg-white/[0.05]" />
            ))}
          </div>
        </div>

        {/* What Is section skeleton */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid items-start gap-12 md:grid-cols-2">
              <div className="space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded-xl bg-white/[0.07]" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-7">
                <div className="mb-4 h-4 w-36 animate-pulse rounded bg-white/[0.06]" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-14 w-full animate-pulse rounded-xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diviner grid skeleton */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto mb-3 h-8 w-64 animate-pulse rounded-xl bg-white/[0.07]" />
            <div className="mx-auto mb-10 h-4 w-48 animate-pulse rounded bg-white/[0.04]" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60"
                >
                  <div className="h-20 w-full animate-pulse bg-white/[0.04]" />
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="size-14 animate-pulse rounded-full bg-white/[0.06]" />
                      <div className="space-y-2">
                        <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-3 w-20 animate-pulse rounded bg-white/[0.04]" />
                      </div>
                    </div>
                    <div className="h-3 w-full animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.04]" />
                    <div className="h-9 w-full animate-pulse rounded-lg bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
