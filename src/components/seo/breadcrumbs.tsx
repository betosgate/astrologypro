import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://www.astrologypro.com${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[#b8bcd0]/70">
          {items.map((item, index) => (
            <li key={item.label} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-[#b8bcd0]/40">/</span>}
              {item.href ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-[#c9a84c]"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#f5f0e8]/90">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
