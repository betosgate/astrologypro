"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye, BookOpen, Search } from "lucide-react";

type JournalRow = {
  journal_type: "scry" | "mundane";
  id: string;
  submitted_at: string;
  student_email: string | null;
  student_name: string | null;
  decan_number: number;
  decan_title: string;
  assigned_card: string | null;
  alternate_card: string | null;
  experience_text: string | null;
  content_preview: string | null;
  relationships_section: string | null;
  business_work_section: string | null;
  shifts_perception_section: string | null;
};

type Filters = {
  type: "all" | "scry" | "mundane";
  decan_number: string;
  date_from: string;
  date_to: string;
};

const DEFAULT_FILTERS: Filters = {
  type: "all",
  decan_number: "",
  date_from: "",
  date_to: "",
};

export default function AdminMysterySchoolJournalsPage() {
  const [journals, setJournals] = useState<JournalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<JournalRow | null>(null);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.type !== "all") params.set("type", f.type);
    if (f.decan_number) params.set("decan_number", f.decan_number);
    if (f.date_from) params.set("date_from", f.date_from);
    if (f.date_to) params.set("date_to", f.date_to);

    const res = await fetch(`/api/admin/mystery-school/journals?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setJournals(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load(activeFilters);
  }, [activeFilters, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveFilters({ ...filters });
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold">Student Journals</h1>
          <a href="/admin/mystery-school" className="text-sm text-primary hover:underline">
            ← Mystery School
          </a>
          <a href="/admin/mystery-school/decans" className="text-sm text-primary hover:underline">
            → Decan Rituals
          </a>
        </div>
        <p className="text-muted-foreground text-sm">
          Review scrying and mundane journal submissions from all students.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Journal Type</Label>
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters((f) => ({ ...f, type: v as Filters["type"] }))}
              >
                <SelectTrigger className="h-8 text-sm w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="scry">Scrying only</SelectItem>
                  <SelectItem value="mundane">Mundane only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Decan Number</Label>
              <Input
                className="h-8 text-sm"
                type="number"
                min={1}
                max={36}
                placeholder="1–36"
                value={filters.decan_number}
                onChange={(e) => setFilters((f) => ({ ...f, decan_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Submitted From</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Submitted To</Label>
              <Input
                className="h-8 text-sm"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
              <Button type="submit" size="sm">
                <Search className="mr-1.5 size-3.5" /> Search
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : journals.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No journal submissions found.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Student</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Decan</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Submitted</th>
                <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Preview</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {journals.map((row) => (
                <tr
                  key={`${row.journal_type}-${row.id}`}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelected(row)}
                >
                  <td className="px-4 py-3">
                    {row.journal_type === "scry" ? (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Eye className="size-2.5" /> Scry
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <BookOpen className="size-2.5" /> Mundane
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{row.student_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{row.student_email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">Decan {row.decan_number}</p>
                    <p className="text-xs text-muted-foreground">{row.decan_title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(row.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-xs text-muted-foreground truncate">
                      {row.content_preview ?? ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Journal detail modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.journal_type === "scry" ? (
                    <Eye className="size-4 text-muted-foreground" />
                  ) : (
                    <BookOpen className="size-4 text-muted-foreground" />
                  )}
                  {selected.journal_type === "scry" ? "Scrying Journal" : "Mundane Journal"} —{" "}
                  Decan {selected.decan_number}
                </DialogTitle>
                <DialogDescription className="space-y-0.5">
                  <span className="block">
                    {selected.student_name ?? "Unknown Student"}{" "}
                    {selected.student_email && (
                      <span className="text-muted-foreground">({selected.student_email})</span>
                    )}
                  </span>
                  <span className="block text-xs">
                    Submitted{" "}
                    {new Date(selected.submitted_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {selected.journal_type === "scry" ? (
                  <>
                    {selected.assigned_card && (
                      <Card>
                        <CardContent className="py-3 px-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                            Assigned Card
                          </p>
                          <p className="text-sm font-medium">{selected.assigned_card}</p>
                          {selected.alternate_card && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Drew alternate: {selected.alternate_card}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Scrying Experience
                      </p>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selected.experience_text ?? "(legacy entry — no structured text)"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {selected.relationships_section ? (
                      <>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Relationships &amp; Personal Connections
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {selected.relationships_section}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Business &amp; Work
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {selected.business_work_section}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                            Shifts in Perception
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {selected.shifts_perception_section}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        (legacy entry — no structured sections)
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
