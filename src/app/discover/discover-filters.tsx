"use client";

import { useMemo, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Search, BadgeCheck, X } from "lucide-react";
import type { DivinerCard, DivinerSubType } from "./page";
import { getDivinerAvatarUrl, getDivinerCoverImageUrl } from "@/lib/diviner-images";

type SortOption = "certified" | "rating" | "sessions" | "price";
type TypeFilter = "all" | DivinerSubType;

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  astrologer: "Astrologer",
  tarot: "Tarot Reader",
  oracle: "Oracle",
};

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "certified", label: "Certified First" },
  { value: "rating", label: "Top Rated" },
  { value: "sessions", label: "Most Sessions" },
  { value: "price", label: "Lowest Price" },
];

const SUB_TYPE_COLORS: Record<DivinerSubType, string> = {
  astrologer: "border-[#4c6bc9]/20 bg-[#4c6bc9]/10 text-[#8ba4e8]",
  tarot: "border-[#9c4cc9]/20 bg-[#9c4cc9]/10 text-[#c08ae8]",
  oracle: "border-[#c9a84c]/20 bg-[#c9a84c]/10 text-[#c9a84c]",
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${
            i < full
              ? "fill-[#c9a84c] text-[#c9a84c]"
              : i === full && half
              ? "fill-[#c9a84c]/50 text-[#c9a84c]/50"
              : "fill-transparent text-[#b8bcd0]/20"
          }`}
        />
      ))}
    </span>
  );
}

function GradientPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#c9a84c]/20 to-[#4c6bc9]/10">
      <span className="font-display text-2xl font-semibold text-[#c9a84c]/60">
        {initials}
      </span>
    </div>
  );
}

function DivinerCardGrid({ diviner }: { diviner: DivinerCard }) {
  const resolvedCoverImageUrl = getDivinerCoverImageUrl(diviner.coverImageUrl);
  const resolvedAvatarUrl = getDivinerAvatarUrl(diviner.avatarUrl);
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0d1117]/60 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]">
      {/* Cover image / gradient */}
      <div className="relative h-24 overflow-hidden bg-[#0d1117]">
        <Image
          src={resolvedCoverImageUrl}
          alt=""
          fill
          className="object-cover opacity-60"
          sizes="(max-width: 768px) 100vw, 384px"
        />
        {!diviner.coverImageUrl && (
          <div className="absolute inset-0">
            <GradientPlaceholder name={diviner.displayName} />
          </div>
        )}

        {/* Certified badge — top-right of cover */}
        {diviner.isCertified && (
          <span
            title="Divine Infinite Being Certified"
            className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#0d1117]/80 px-2 py-0.5 text-[10px] font-semibold text-[#c9a84c] backdrop-blur-sm"
          >
            <BadgeCheck className="size-3" aria-hidden="true" />
            DIB Certified
          </span>
        )}
      </div>

      {/* Avatar — overlaps cover */}
      <div className="relative -mt-7 flex flex-col px-5">
        <div className="flex items-end justify-between">
          <div className="relative size-14 overflow-hidden rounded-full border-2 border-[#0d1117] ring-1 ring-[#c9a84c]/20">
            <Image
              src={resolvedAvatarUrl}
              alt={diviner.displayName}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>

          {/* Sub-type pill */}
          <span
            className={`mb-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${SUB_TYPE_COLORS[diviner.subType]}`}
          >
            {TYPE_LABELS[diviner.subType]}
          </span>
        </div>

        {/* Name + tagline */}
        <div className="mt-3">
          <h3 className="font-semibold text-[#f5f0e8] group-hover:text-[#c9a84c] transition-colors">
            {diviner.displayName}
          </h3>
          {diviner.tagline && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">
              {diviner.tagline}
            </p>
          )}
        </div>

        {/* Specialties tags */}
        {diviner.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {diviner.specialties.slice(0, 3).map((spec) => (
              <Badge
                key={spec}
                variant="outline"
                className="border-[#c9a84c]/10 bg-[#c9a84c]/5 text-[10px] text-[#c9a84c]/80"
              >
                {spec}
              </Badge>
            ))}
            {diviner.specialties.length > 3 && (
              <Badge
                variant="outline"
                className="border-white/5 text-[10px] text-[#b8bcd0]/40"
              >
                +{diviner.specialties.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {diviner.averageRating !== null && diviner.reviewCount > 0 && (
            <span className="flex items-center gap-1.5 text-[#c9a84c]">
              <StarRating rating={diviner.averageRating} />
              <span className="font-medium">{diviner.averageRating.toFixed(1)}</span>
              <span className="text-[#b8bcd0]/40">({diviner.reviewCount})</span>
            </span>
          )}
          {diviner.completedSessions > 0 && (
            <span className="text-[#b8bcd0]/50">
              {diviner.completedSessions.toLocaleString()} session
              {diviner.completedSessions !== 1 ? "s" : ""}
            </span>
          )}
          {diviner.startingPrice !== null && (
            <span className="ml-auto font-medium text-[#f5f0e8]">
              From ${diviner.startingPrice}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mb-5 mt-4">
          <Button
            asChild
            className="w-full bg-[#c9a84c] text-black hover:bg-[#e2c97e] font-semibold"
          >
            <Link href={`/${diviner.username}`}>
              Book a Reading
              <ArrowRight className="ml-1 size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

const SESSION_DISMISSED_KEY = "preferred_diviner_dismissed";

function PreferredDivinerBanner({ diviner }: { diviner: DivinerCard }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(SESSION_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  if (dismissed) return null;

  return (
    <section
      aria-label="Your Astrologer"
      className="mb-10 rounded-2xl border border-[#c9a84c]/25 bg-[#c9a84c]/5 p-5"
    >
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-[#c9a84c]">⭐</span>
          <h2 className="font-display text-lg font-semibold text-[#c9a84c]">
            Your Astrologer
          </h2>
        </div>
        <button
          onClick={handleDismiss}
          className="text-sm text-[#b8bcd0]/50 underline underline-offset-2 transition-colors hover:text-[#b8bcd0]/80"
          aria-label="Dismiss your astrologer section"
        >
          Choose a different astrologer
        </button>
      </div>

      {/* Diviner card with "Your Astrologer" badge overlay */}
      <div className="relative max-w-sm">
        {/* Badge */}
        <div className="absolute -top-2.5 left-4 z-10">
          <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a84c]/60 bg-[#c9a84c] px-3 py-0.5 text-[11px] font-semibold text-black shadow-sm">
            ⭐ Your Astrologer
          </span>
        </div>
        <DivinerCardGrid diviner={diviner} />
      </div>
    </section>
  );
}

export function DiscoverFilters({
  diviners,
  total,
  preferredDiviner = null,
}: {
  diviners: DivinerCard[];
  total: number;
  preferredDiviner?: DivinerCard | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const type = (searchParams.get("type") ?? "all") as TypeFilter;
  const sort = (searchParams.get("sort") ?? "certified") as SortOption;

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === "" || value === "all" || value === "certified") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Always clear page when filters change
      params.delete("page");
      const query = params.toString();
      router.replace(`/discover${query ? `?${query}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (value: string) => updateParams({ search: value }),
    [updateParams]
  );
  const handleType = useCallback(
    (value: TypeFilter) => updateParams({ type: value }),
    [updateParams]
  );
  const handleSort = useCallback(
    (value: SortOption) => updateParams({ sort: value }),
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    router.replace("/discover", { scroll: false });
  }, [router]);

  const hasActiveFilters = search !== "" || type !== "all" || sort !== "certified";

  const filtered = useMemo(() => {
    let result = [...diviners];

    // Search: display_name, tagline, bio, specialties
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.displayName.toLowerCase().includes(q) ||
          (d.tagline?.toLowerCase().includes(q) ?? false) ||
          (d.bio?.toLowerCase().includes(q) ?? false) ||
          d.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (type !== "all") {
      result = result.filter((d) => d.subType === type);
    }

    // Sort
    switch (sort) {
      case "certified":
        result.sort((a, b) => {
          if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
          if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
          return b.completedSessions - a.completedSessions;
        });
        break;
      case "rating":
        result.sort((a, b) => {
          // Certified always above non-certified within same rating bucket
          const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
          if (Math.abs(ratingDiff) > 0.001) return ratingDiff;
          if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
          return b.reviewCount - a.reviewCount;
        });
        break;
      case "sessions":
        result.sort((a, b) => {
          if (b.completedSessions !== a.completedSessions)
            return b.completedSessions - a.completedSessions;
          if (a.isCertified !== b.isCertified) return a.isCertified ? -1 : 1;
          return 0;
        });
        break;
      case "price":
        result.sort(
          (a, b) => (a.startingPrice ?? 9999) - (b.startingPrice ?? 9999)
        );
        break;
    }

    return result;
  }, [diviners, search, type, sort]);

  return (
    <div>
      {/* Preferred diviner — shown above filters when cookie is set */}
      {preferredDiviner && <PreferredDivinerBanner diviner={preferredDiviner} />}

      {/* Filters bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b8bcd0]/40"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name, specialty, or keyword..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 border-white/10 bg-[#0d1117] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30 focus-visible:ring-[#c9a84c]/30"
            aria-label="Search diviners"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b8bcd0]/40 hover:text-[#b8bcd0]/80 transition-colors"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Type filter pills */}
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="Filter by practitioner type"
        >
          {(["all", "astrologer", "tarot", "oracle"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleType(opt)}
              className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-all ${
                type === opt
                  ? "border-[#c9a84c] bg-[#c9a84c] text-black"
                  : "border-white/10 bg-transparent text-[#b8bcd0]/60 hover:border-white/20 hover:text-[#f5f0e8]"
              }`}
              aria-pressed={type === opt}
            >
              {TYPE_LABELS[opt]}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => handleSort(e.target.value as SortOption)}
          className="h-9 rounded-md border border-white/10 bg-[#0d1117] px-3 text-sm text-[#b8bcd0]/80 outline-none focus:border-[#c9a84c]/30 focus:ring-0"
          aria-label="Sort diviners"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results count + clear filters */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[#b8bcd0]/50">
          Showing{" "}
          <span className="font-medium text-[#b8bcd0]/80">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-medium text-[#b8bcd0]/80">{total}</span> diviner
          {total !== 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-sm text-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors"
          >
            <X className="size-3" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-[#b8bcd0]/50">
            No diviners match your search
          </p>
          <p className="mt-2 text-sm text-[#b8bcd0]/30">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={clearFilters}
            className="mt-6 inline-flex h-9 items-center rounded-full border border-[#c9a84c]/30 px-4 text-sm text-[#c9a84c] transition-colors hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((diviner) => (
            <DivinerCardGrid key={diviner.username} diviner={diviner} />
          ))}
        </div>
      )}
    </div>
  );
}
