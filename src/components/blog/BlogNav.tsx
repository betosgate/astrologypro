import Link from "next/link";

type Category = { id: string; name: string; slug: string };

export function BlogNav({ categories }: { categories: Category[] }) {
  return (
    <nav
      aria-label="Blog navigation"
      className="sticky top-[80px] z-40 border-b border-white/[0.06] bg-[#06080f]/90 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {/* Blog home */}
        <Link
          href="/blog"
          className="shrink-0 rounded-full px-3 py-1.5 text-sm text-[#b8bcd0]/70 transition-colors hover:bg-white/[0.05] hover:text-[#f5f0e8]"
        >
          All Posts
        </Link>

        {/* Category links */}
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/blog/category/${cat.slug}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-[#b8bcd0]/70 transition-colors hover:bg-white/[0.05] hover:text-[#f5f0e8]"
          >
            {cat.name}
          </Link>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <Link
          href="/blog/search"
          aria-label="Search blog"
          className="shrink-0 flex size-8 items-center justify-center rounded-full text-[#b8bcd0]/60 transition-colors hover:bg-white/[0.05] hover:text-[#f5f0e8]"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z"
            />
          </svg>
        </Link>

        {/* RSS */}
        <Link
          href="/api/blog/rss"
          aria-label="RSS feed"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex size-8 items-center justify-center rounded-full text-[#b8bcd0]/60 transition-colors hover:bg-white/[0.05] hover:text-[#c9a84c]"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 110 2 1 1 0 010-2z"
            />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
