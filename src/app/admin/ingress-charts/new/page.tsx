"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Info, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CityAutocomplete } from "@/app/admin/horoscope/components/city-autocomplete";
import type { CityOption } from "@/app/admin/horoscope/types";

const SECTORS = [
  { key: "Government & Leadership", val: "governmentAndLeadership" },
  { key: "Social Climate & Public Mood", val: "socialClimateAndPublicMood" },
  { key: "Weather & Agriculture", val: "weatherAndAgriculture" },
  { key: "Potential Conflicts & Alliances", val: "potentialConflictsAndAlliances" },
  { key: "Public Health & Workforce", val: "publicHealthAndWorkforce" },
  { key: "Communications & Transportation", val: "communicationsAndTransportation" },
  { key: "Justice, Law & Foreign Trade", val: "justiceLawAndForeignTrade" },
  { key: "Natural Disasters", val: "naturalDisasters" },
];

function addDays(date: string, days: number) {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function SectorDropdown({
  selected,
  onChange,
  disabled = false,
}: {
  selected: string[];
  onChange: (vals: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleSector(val: string) {
    onChange(
      selected.includes(val)
        ? selected.filter((item) => item !== val)
        : [...selected, val],
    );
  }

  const label =
    selected.length === 0
      ? "Select sectors"
      : `${selected.length} sector${selected.length > 1 ? "s" : ""} selected`;

  return (
    <div className="relative space-y-1.5" ref={ref}>
      <Label>Sectors</Label>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-between"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {SECTORS.map((sector) => (
              <label
                key={sector.val}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(sector.val)}
                  onCheckedChange={() => toggleSector(sector.val)}
                />
                <span>{sector.key}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2 border-t pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={() => onChange(SECTORS.map((sector) => sector.val))}
            >
              Select all
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 flex-1 text-xs"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewIngressChartPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sectorFocus, setSectorFocus] = useState<string[]>(SECTORS.map((sector) => sector.val));
  const [city, setCity] = useState<CityOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const minEndDate = startDate ? addDays(startDate, 14) : "";

  function handleStartDateChange(value: string) {
    setStartDate(value);

    if (!value) {
      setEndDate("");
      return;
    }

    const nextMinEndDate = addDays(value, 14);
    if (endDate && endDate < nextMinEndDate) {
      setEndDate("");
    }
  }

  function handleClear() {
    setStartDate("");
    setEndDate("");
    setSectorFocus(SECTORS.map((sector) => sector.val));
    setCity(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!startDate) {
      setError("Start Date is required.");
      return;
    }

    if (!endDate) {
      setError("End Date is required.");
      return;
    }

    if (endDate < minEndDate) {
      setError("End Date must be at least 2 weeks after Start Date.");
      return;
    }

    if (sectorFocus.length === 0) {
      setError("Select at least one sector.");
      return;
    }

    if (!city) {
      setError("Select a city from the autocomplete list.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/ingress-charts/create-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          sectors: sectorFocus,
          city,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.detail || json.error || "Failed to start chart calculation.");
      }

      setSuccessOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Ingress Chart</h1>
        <p className="text-muted-foreground">
          Generate ingress charts from date range, sectors, and city.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chart Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={endDate}
                  min={minEndDate}
                  disabled={!startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectorDropdown
                selected={sectorFocus}
                onChange={setSectorFocus}
                disabled={saving}
              />
              <CityAutocomplete value={city} onChange={setCity} label="City" disabled={saving} />
            </div>

            <div className="flex gap-3 rounded-md border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Creation notes</p>
                <p>
                  The end date unlocks after choosing a start date and must be at least 2
                  weeks later. After submit, your chart request will be prepared in the
                  background. Newly completed charts will appear on the ingress charts page
                  within 30 minutes.
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="outline" disabled={saving} onClick={handleClear}>
                Clear
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 size-4" />
                )}
                {saving ? "Starting..." : "Submit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chart calculation started</DialogTitle>
            <DialogDescription>
              Your chart request is being prepared. We will update the ingress charts page
              within 30 minutes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => router.push("/admin/ingress-charts")}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
