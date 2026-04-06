export default function BlogLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-[#06080f]">
      {/* Animate pulse skeleton */}
      <div className="relative z-10 flex flex-1 flex-col">
        {/* Nav placeholder */}
        <div className="sticky top-[80px] z-40 h-12 border-b border-white/[0.06] bg-[#06080f]/90" />

        <main className="flex-1 px-4 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl animate-pulse">
            {/* Hero card skeleton */}
            <div className="mb-12 aspect-[16/7] w-full rounded-3xl bg-white/[0.04]" />

            {/* Section label */}
            <div className="mb-5 h-3 w-24 rounded-full bg-white/[0.06]" />

            {/* 3-col card grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="aspect-video w-full bg-white/[0.04]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-20 rounded-full bg-white/[0.06]" />
                    <div className="h-4 w-3/4 rounded-full bg-white/[0.07]" />
                    <div className="h-3 w-full rounded-full bg-white/[0.04]" />
                    <div className="h-3 w-5/6 rounded-full bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
