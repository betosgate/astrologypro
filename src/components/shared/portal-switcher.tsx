import Link from "next/link";
import type { UserPortal } from "@/lib/user-roles";

interface PortalSwitcherProps {
  portals: UserPortal[];
  currentBase: string; // e.g. "/dashboard", "/portal", "/advocate"
}

/**
 * Renders compact links to other portals when a user has multiple roles.
 * Shown in the right side of portal headers.
 */
export function PortalSwitcher({ portals, currentBase }: PortalSwitcherProps) {
  const others = portals.filter((p) => p.href !== currentBase);
  if (others.length === 0) return null;

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <span className="text-xs text-muted-foreground/50 mr-1">|</span>
      {others.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={p.badge ?? p.label}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}
