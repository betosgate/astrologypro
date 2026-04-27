"use client";

// Tab nav across the admin /reports/affiliates surfaces. Highlights the
// active tab via pathname matching.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/reports/affiliates", label: "Overview" },
  { href: "/admin/reports/affiliates/by-diviner", label: "By diviner" },
  { href: "/admin/reports/affiliates/by-affiliate", label: "By affiliate" },
  { href: "/admin/reports/affiliates/clicks", label: "Clicks" },
  { href: "/admin/reports/affiliates/conversions", label: "Conversions" },
  { href: "/admin/reports/affiliates/rate-history", label: "Rate history" },
];

export function ReportsTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Affiliate reports navigation"
      className="flex flex-wrap gap-1 border-b"
    >
      {tabs.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
