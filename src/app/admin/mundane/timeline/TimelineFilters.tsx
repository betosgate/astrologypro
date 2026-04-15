"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const EVENT_TYPES = [
  "ingress",
  "eclipse",
  "station",
  "conjunction",
  "opposition",
  "lunation",
  "return",
] as const;

type EventType = (typeof EVENT_TYPES)[number];

// Badge colors matching the spec
const EVENT_TYPE_COLORS: Record<string, string> = {
  eclipse: "bg-red-100 text-red-700 border-red-200",
  ingress: "bg-violet-100 text-violet-700 border-violet-200",
  station: "bg-amber-100 text-amber-700 border-amber-200",
  conjunction: "bg-blue-100 text-blue-700 border-blue-200",
  opposition: "bg-blue-100 text-blue-700 border-blue-200",
  lunation: "bg-teal-100 text-teal-700 border-teal-200",
  return: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const EVENT_TYPE_ACTIVE: Record<string, string> = {
  eclipse: "bg-red-500 text-white border-red-500",
  ingress: "bg-violet-500 text-white border-violet-500",
  station: "bg-amber-500 text-white border-amber-500",
  conjunction: "bg-blue-500 text-white border-blue-500",
  opposition: "bg-blue-500 text-white border-blue-500",
  lunation: "bg-teal-500 text-white border-teal-500",
  return: "bg-emerald-500 text-white border-emerald-500",
};

type Entity = {
  id: string;
  name: string;
  flag_emoji: string | null;
};

type Props = {
  activeTypes: string[];
  entityId: string | null;
  entities: Entity[];
};

export function TimelineFilters({ activeTypes, entityId, entities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  function toggleType(type: EventType) {
    const current = new Set(activeTypes);
    if (current.has(type)) {
      current.delete(type);
    } else {
      current.add(type);
    }
    updateParams({ types: current.size > 0 ? [...current].join(",") : null });
  }

  function setEntity(id: string | null) {
    updateParams({ entity_id: id });
  }

  return (
    <div className="space-y-3">
      {/* Event type filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground shrink-0">Filter:</span>
        {EVENT_TYPES.map((type) => {
          const isActive = activeTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer select-none ${
                isActive
                  ? (EVENT_TYPE_ACTIVE[type] ?? "bg-gray-500 text-white border-gray-500")
                  : (EVENT_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700 border-gray-200")
              }`}
            >
              {type}
            </button>
          );
        })}
        {activeTypes.length > 0 && (
          <button
            onClick={() => updateParams({ types: null })}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear
          </button>
        )}
        {isPending && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>

      {/* Entity selector */}
      {entities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground shrink-0">Entity:</span>
          <select
            className="h-7 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            value={entityId ?? ""}
            onChange={(e) => setEntity(e.target.value || null)}
          >
            <option value="">— None (no natal hits) —</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.flag_emoji ? `${e.flag_emoji} ` : ""}{e.name}
              </option>
            ))}
          </select>
          {entityId && (
            <button
              onClick={() => setEntity(null)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Re-export badge colors for use in the server page
export { EVENT_TYPE_COLORS };

// Badge component for event type — used in server-rendered rows
export function EventTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs capitalize shrink-0 ${
        EVENT_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {type.replace(/_/g, " ")}
    </Badge>
  );
}
