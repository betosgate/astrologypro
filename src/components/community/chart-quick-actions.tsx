"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Telescope,
  CalendarDays,
  Heart,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { BirthCityAutocomplete } from "@/components/community/birth-city-autocomplete";

type ChartType = "natal" | "monthly" | "relationship";

interface CityOption {
  label: string;
  lat: number;
  lng: number;
  tzone: string;
}

interface ResolvedBirthData {
  source: "family_self" | "past_booking" | "member_profile" | "none";
  fullName: string | null;
  dateOfBirth: string | null;
  birthTime: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  birthLat: number | null;
  birthLng: number | null;
  birthTimezone: string | null;
  selfFamilyMemberId: string | null;
  missing: string[];
}

const SOURCE_LABELS: Record<ResolvedBirthData["source"], string> = {
  family_self: "from your family profile",
  past_booking: "from your past booking",
  member_profile: "from your member profile",
  none: "",
};

type ResultState =
  | { kind: "idle" }
  | { kind: "loading"; type: ChartType }
  | { kind: "success"; type: ChartType; message: string }
  | { kind: "error"; message: string };

export function ChartQuickActions() {
  const [birthData, setBirthData] = useState<ResolvedBirthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ResultState>({ kind: "idle" });

  // Modal state (opens when user clicks a button and data is incomplete)
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingType, setPendingType] = useState<ChartType | null>(null);

  // Form state for modal
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [time, setTime] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [searchingCity, setSearchingCity] = useState(false);
  // OLD STATE (Commented out as per user request)
  /*
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const cityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  */

  // ── Initial fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    void fetchBirthData();
  }, []);

  async function fetchBirthData() {
    setLoading(true);
    try {
      const res = await fetch("/api/community/me/birth-data");
      if (!res.ok) {
        setBirthData(null);
        return;
      }
      const json = await res.json();
      setBirthData(json.data);
      // Prefill modal with any partial data
      if (json.data) {
        setFullName(json.data.fullName ?? "");
        setDob(json.data.dateOfBirth ?? "");
        setTime(json.data.birthTime ?? "");
        setCityQuery(json.data.birthCity ?? "");
        if (json.data.birthLat && json.data.birthLng && json.data.birthCity) {
          setSelectedCity({
            label: json.data.birthCity,
            lat: json.data.birthLat,
            lng: json.data.birthLng,
            tzone: json.data.birthTimezone ?? "",
          });
        }
      }
    } catch {
      setBirthData(null);
    } finally {
      setLoading(false);
    }
  }


  // ── Actions ───────────────────────────────────────────────────────────────
  function hasCompleteData(d: ResolvedBirthData | null): boolean {
    return (
      !!d &&
      !!d.dateOfBirth &&
      d.birthLat != null &&
      d.birthLng != null
    );
  }

  async function handleGenerate(type: ChartType) {
    if (!hasCompleteData(birthData)) {
      setPendingType(type);
      setModalOpen(true);
      return;
    }
    await runGenerate(type);
  }

  async function runGenerate(type: ChartType, inlineBirthData?: Record<string, unknown>) {
    setResult({ kind: "loading", type });
    try {
      const res = await fetch("/api/community/me/generate-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(inlineBirthData ? { birthData: inlineBirthData } : {}),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setResult({
          kind: "error",
          message: json.detail ?? json.error ?? json.title ?? "Failed to generate",
        });
        return;
      }

      const labels: Record<ChartType, string> = {
        natal: "Natal chart generated",
        monthly: "Monthly transits generated",
        relationship: `Relationship charts generated (${json.data?.totalPairs ?? 0} pairs)`,
      };

      setResult({ kind: "success", type, message: labels[type] });
      // Refresh resolved data (source may have changed to family_self)
      await fetchBirthData();
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  async function handleModalSubmit() {
    if (!pendingType) return;
    if (!fullName.trim() || !dob || !selectedCity) {
      setResult({ kind: "error", message: "Please fill in name, date of birth, and city" });
      return;
    }

    setModalOpen(false);
    await runGenerate(pendingType, {
      fullName: fullName.trim(),
      dateOfBirth: dob,
      birthTime: time || null,
      birthCity: selectedCity.label,
      birthCountry: null,
      birthLat: selectedCity.lat,
      birthLng: selectedCity.lng,
    });
    setPendingType(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const isLoading = (t: ChartType) => result.kind === "loading" && result.type === t;
  const sourceLabel = birthData ? SOURCE_LABELS[birthData.source] : "";

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle className="text-base">Quick Chart Generation</CardTitle>
          </div>
          <CardDescription>
            One-click charts using your saved birth data.{" "}
            {birthData?.source && birthData.source !== "none" && (
              <span className="inline-flex items-center gap-1 ml-1">
                <Badge variant="outline" className="text-xs">
                  {sourceLabel}
                </Badge>
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Result banner */}
          {result.kind === "success" && (
            <div className="flex items-center gap-2 rounded-md border border-green-400/40 bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle2 className="size-4 shrink-0" /> {result.message}
            </div>
          )}
          {result.kind === "error" && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" /> {result.message}
            </div>
          )}

          {/* Three action buttons */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={loading || isLoading("natal")}
              onClick={() => handleGenerate("natal")}
            >
              {isLoading("natal") ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Telescope className="size-6 text-primary" />
              )}
              <div className="text-center">
                <p className="font-semibold text-sm">Natal Chart</p>
                <p className="text-xs text-muted-foreground">Your birth chart</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={loading || isLoading("monthly")}
              onClick={() => handleGenerate("monthly")}
            >
              {isLoading("monthly") ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <CalendarDays className="size-6 text-primary" />
              )}
              <div className="text-center">
                <p className="font-semibold text-sm">Monthly Transits</p>
                <p className="text-xs text-muted-foreground">This month&apos;s forecast</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              disabled={loading || isLoading("relationship")}
              onClick={() => handleGenerate("relationship")}
            >
              {isLoading("relationship") ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Heart className="size-6 text-primary" />
              )}
              <div className="text-center">
                <p className="font-semibold text-sm">Relationship Charts</p>
                <p className="text-xs text-muted-foreground">All family pairs</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Birth-data modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !open && setModalOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>We need your birth data once</DialogTitle>
            <DialogDescription>
              Enter your birth details so we can generate your chart. We&apos;ll save it to
              your profile so you don&apos;t have to enter it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qa-name">Full Name</Label>
              <Input
                id="qa-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qa-dob">Date of Birth</Label>
                <Input
                  id="qa-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qa-time">Birth Time (optional)</Label>
                <Input
                  id="qa-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qa-city">Birth City</Label>
              <BirthCityAutocomplete
                id="qa-city"
                value={cityQuery}
                onChange={(label, opt) => {
                  setCityQuery(label);
                  if (opt) {
                    setSelectedCity({
                      label: opt.label,
                      lat: opt.lat,
                      lng: opt.lng,
                      tzone: opt.tzone,
                    });
                  } else {
                    setSelectedCity(null);
                  }
                }}
                placeholder="Start typing your birth city…"
              />
              {selectedCity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-green-600" />
                  {selectedCity.label} — {selectedCity.lat.toFixed(2)},{" "}
                  {selectedCity.lng.toFixed(2)}
                </p>
              )}

              {/* OLD Input (Commented out as per user request)
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="qa-city"
                  className="pl-9"
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setSelectedCity(null);
                  }}
                  placeholder="Start typing your birth city…"
                />
                {searchingCity && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {cityOptions?.length > 0 && !selectedCity && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {cityOptions.map((opt, i) => (
                    <button
                      key={`${opt.label}-${i}`}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40"
                      onClick={() => {
                        setSelectedCity(opt);
                        setCityQuery(opt.label);
                        setCityOptions([]);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              */}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleModalSubmit}
              disabled={!fullName.trim() || !dob || !selectedCity}
            >
              Save & Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
