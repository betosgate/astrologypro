export default function BlogPostLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Cover image skeleton */}
        <div className="h-[50vh] min-h-[320px] max-h-[520px] w-full bg-white/[0.04] animate-pulse" />

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl animate-pulse">
            {/* Back link */}
            <div className="mb-6 h-4 w-28 rounded-full bg-white/[0.06]" />

            {/* Article header */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
                <div className="h-5 w-24 rounded-full bg-white/[0.04]" />
              </div>
              <div className="h-9 w-3/4 rounded-xl bg-white/[0.07]" />
              <div className="h-5 w-full rounded-xl bg-white/[0.04]" />
              <div className="h-5 w-5/6 rounded-xl bg-white/[0.04]" />
              {/* Author row */}
              <div className="flex items-center gap-3 pt-2">
                <div className="size-9 rounded-full bg-white/[0.06]" />
                <div className="h-4 w-28 rounded-full bg-white/[0.06]" />
              </div>
            </div>

            {/* Two-col layout */}
            <div className="flex flex-col gap-10 lg:flex-row">
              {/* Main content */}
              <div className="flex-[7] space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 rounded-full bg-white/[0.04]"
                    style={{ width: `${75 + (i % 3) * 8}%` }}
                  />
                ))}
                <div className="my-8 h-48 rounded-2xl bg-white/[0.04]" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={`b${i}`}
                    className="h-4 rounded-full bg-white/[0.04]"
                    style={{ width: `${70 + (i % 4) * 7}%` }}
                  />
                ))}
              </div>

              {/* Sidebar */}
              <aside className="flex flex-col gap-5 lg:flex-[3]">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 space-y-3">
                  <div className="h-3 w-28 rounded-full bg-white/[0.06]" />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-3 rounded-full bg-white/[0.04]" style={{ width: `${60 + i * 8}%` }} />
                  ))}
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 space-y-3">
                  <div className="h-3 w-32 rounded-full bg-white/[0.06]" />
                  <div className="flex gap-3">
                    <div className="size-12 rounded-full bg-white/[0.06]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-28 rounded-full bg-white/[0.07]" />
                      <div className="h-3 w-full rounded-full bg-white/[0.04]" />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
