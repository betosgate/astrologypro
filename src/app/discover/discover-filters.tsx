"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Search } from "lucide-react";

interface DivinerCard {
  id: string;
  username: string;
  display_name: string;
  tagline: string | null;
  avatar_url: string | null;
  specialties: string[];
  completedSessions: number;
  averageRating: number | null;
  reviewCount: number;
  startingPrice: number | null;
}

type SortOption = "rating" | "price" | "sessions";
type SpecialtyFilter = "all" | "astrology" | "tarot";

export function DiscoverFilters({
  diviners,
}: {
  diviners: DivinerCard[];
}) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyFilter>("all");
  const [sort, setSort] = useState<SortOption>("rating");

  const filtered = useMemo(() => {
    let result = [...diviners];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.display_name.toLowerCase().includes(q) ||
          (d.tagline?.toLowerCase().includes(q) ?? false) ||
          d.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Specialty filter
    if (specialty === "astrology") {
      result = result.filter((d) =>
        d.specialties.some((s) => s.toLowerCase().includes("astrology"))
      );
    } else if (specialty === "tarot") {
      result = result.filter((d) =>
        d.specialties.some((s) => s.toLowerCase().includes("tarot"))
      );
    }

    // Sort
    switch (sort) {
      case "rating":
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        break;
      case "price":
        result.sort(
          (a, b) => (a.startingPrice ?? 999) - (b.startingPrice ?? 999)
        );
        break;
      case "sessions":
        result.sort((a, b) => b.completedSessions - a.completedSessions);
        break;
    }

    return result;
  }, [diviners, search, specialty, sort]);

  return (
    <div>
      {/* Filters bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b8bcd0]/40" />
          <Input
            placeholder="Search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-white/10 bg-[#0d1117] text-[#f5f0e8] placeholder:text-[#b8bcd0]/30"
          />
        </div>

        <div className="flex gap-1.5">
          {(["all", "astrology", "tarot"] as const).map((opt) => (
            <Button
              key={opt}
              variant={specialty === opt ? "default" : "outline"}
              size="sm"
              onClick={() => setSpecialty(opt)}
              className={
                specialty === opt
                  ? "bg-[#c9a84c] text-black hover:bg-[#e2c97e]"
                  : "border-white/10 text-[#b8bcd0]/60 hover:text-[#f5f0e8]"
              }
            >
              {opt === "all" ? "All" : opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="h-9 rounded-md border border-white/10 bg-[#0d1117] px-3 text-sm text-[#b8bcd0]/80 outline-none"
        >
          <option value="rating">Highest Rated</option>
          <option value="price">Lowest Price</option>
          <option value="sessions">Most Sessions</option>
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[#b8bcd0]/50">
            No readers found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((diviner) => (
            <div
              key={diviner.id}
              className="group rounded-2xl border border-white/5 bg-[#0d1117]/60 p-6 transition-all hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]"
            >
              <div className="flex items-start gap-4">
                {diviner.avatar_url ? (
                  <img
                    src={diviner.avatar_url}
                    alt={diviner.display_name}
                    className="size-14 rounded-full border border-[#c9a84c]/20 object-cover"
                  />
                ) : (
                  <div className="flex size-14 items-center justify-center rounded-full bg-[#c9a84c]/10 text-lg font-semibold text-[#c9a84c]">
                    {diviner.display_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-[#f5f0e8]">
                    {diviner.display_name}
                  </h3>
                  {diviner.tagline && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-[#b8bcd0]/60">
                      {diviner.tagline}
                    </p>
                  )}
                </div>
              </div>

              {diviner.specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
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

              <div className="mt-4 flex items-center gap-4 text-sm">
                {diviner.averageRating !== null && (
                  <span className="flex items-center gap-1 text-[#c9a84c]">
                    <Star className="size-3.5 fill-current" />
                    {diviner.averageRating.toFixed(1)}
                    <span className="text-[#b8bcd0]/40">
                      ({diviner.reviewCount})
                    </span>
                  </span>
                )}
                {diviner.completedSessions > 0 && (
                  <span className="text-[#b8bcd0]/50">
                    {diviner.completedSessions} session
                    {diviner.completedSessions !== 1 ? "s" : ""}
                  </span>
                )}
                {diviner.startingPrice !== null && (
                  <span className="ml-auto text-[#f5f0e8]">
                    From ${diviner.startingPrice}
                  </span>
                )}
              </div>

              <div className="mt-5">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-[#c9a84c]/20 text-[#c9a84c] hover:bg-[#c9a84c]/5 hover:border-[#c9a84c]/40"
                >
                  <Link href={`/${diviner.username}`}>
                    View Profile
                    <ArrowRight className="ml-1 size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
