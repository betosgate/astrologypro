"use client";

/**
 * Single-tab horoscope session client.
 *
 * Rendering model (lean by design, per product decision 2026-04-18 "no refactor
 * of the main horoscope page"):
 *   - Banner with booking context (service name, scheduled time, client name)
 *   - Pre-filled birth form (client + optional partner)
 *   - A single "Generate Reading" button that auto-fires on mount if the form
 *     is valid (this is the "Enter clicked automatically" requirement)
 *   - Simple result panel: natal chart metadata + AI interpretation text
 *
 * Reuses the existing horoscope helpers (api.ts, utils.ts, constants.ts)
 * WITHOUT modifying them. Does NOT render tabs — this view is intentionally
 * scoped to the one service the client booked.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, ExternalLink, AlertCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  callCompute,
  callAI,
} from "../../api";
import { buildAiPrompts } from "../../build-ai-prompts";
import { CityAutocomplete } from "../../components/city-autocomplete";
import type { BirthInput, CityOption } from "../../types";

// ─── Timezone helper — computes numeric hour offset for IANA tz on a given date.
// The horoscope compute API expects `tzone` as a decimal hour offset (e.g. 5.5).
// We can't reuse horoscope/utils.ts:parseBirth because it requires a pre-computed
// offset_string we don't have from the clients table.
function decimalOffsetForIanaTz(ianaTz: string, dob: string): number {
  try {
    const d = new Date(`${dob}T12:00:00Z`);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTz,
      timeZoneName: "shortOffset",
    });
    const name = fmt.formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    const hours = parseInt(m[2], 10);
    const mins = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hours + mins / 60);
  } catch {
    return 0;
  }
}

// Mirror of /admin/horoscope/page.tsx:parseAiJsonResponse — the raw AI
// response is usually a JSON string (sometimes fenced). Unwrap defensively.
function parseAiJsonResponse(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    trimmed
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim(),
  ];
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // keep trying
    }
  }
  return raw;
}

function birthPayload(b: BirthInput) {
  const [year, month, day] = b.dob.split("-").map(Number);
  const [hour, min] = b.tob.split(":").map(Number);
  const tz = b.city?.timezone?.name ?? "UTC";
  return {
    day,
    month,
    year,
    hour,
    min,
    lat: b.city!.lat,
    lon: b.city!.lng,
    tzone: decimalOffsetForIanaTz(tz, b.dob),
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PrefillBirth {
  fullName: string;
  dob: string;
  tob: string;
  city: {
    label: string;
    lat: number;
    lng: number;
    timezone: string;
  } | null;
}

interface Props {
  bookingId: string;
  tabSlug: string;
  serviceName: string;
  scheduledAt: string | null;
  clientBirth: PrefillBirth;
  needsPartner: boolean;
  partnerBirth: PrefillBirth | null;
}

type Phase = "idle" | "computing" | "done" | "error";

// Unknown birth time default — astrology convention uses 12:00 PM (a "noon
// chart") when the client doesn't know / didn't provide their birth time.
// Houses and rising sign can't be resolved precisely, but planetary positions
// are still meaningful. The form surfaces this fallback with an amber note
// so the diviner can override it.
const NOON_DEFAULT_TOB = "12:00";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cityOf(b: PrefillBirth): CityOption | null {
  if (!b.city) return null;
  return {
    label: b.city.label,
    lat: b.city.lat,
    lng: b.city.lng,
    timezone: {
      name: b.city.timezone,
      offset_string: "",
      utcOffset: "",
    },
  };
}

function toBirthInput(b: PrefillBirth): BirthInput {
  // If the booking didn't capture a TOB, pre-fill with noon. The diviner
  // can still edit the field before the reading runs. Without this, the
  // "Generate reading" button stays disabled for every booking whose
  // intake form didn't include a time — which is most of them today.
  const tob = b.tob && b.tob.trim() ? b.tob : NOON_DEFAULT_TOB;
  return { dob: b.dob, tob, city: cityOf(b) };
}

function isBirthComplete(b: BirthInput): boolean {
  return !!b.dob && !!b.tob && !!b.city;
}

function formatScheduled(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

// Two-person tab identifiers (keep in sync with ASTROLOGY_TAB_MAP values)
const TWO_PERSON_TABS = new Set([
  "romantic_forecast_report_tropical_v2",
  "friendship_report_tropical_v2",
  "business_partner_v2",
]);

// ─── Component ───────────────────────────────────────────────────────────────

export function SingleHoroscopeSession(props: Props) {
  const isTwoPerson = TWO_PERSON_TABS.has(props.tabSlug);

  // Track whether a person's TOB was defaulted to noon (booking didn't
  // capture a time). Drives the amber "using 12:00 PM" note in the UI.
  const clientTobMissing = !(
    props.clientBirth.tob && props.clientBirth.tob.trim()
  );
  const partnerTobMissing = !!(
    props.partnerBirth &&
    !(props.partnerBirth.tob && props.partnerBirth.tob.trim())
  );

  // Form state — pre-filled from props, editable
  const [person1, setPerson1] = useState<BirthInput>(() =>
    toBirthInput(props.clientBirth),
  );
  const [person2, setPerson2] = useState<BirthInput>(() =>
    props.partnerBirth ? toBirthInput(props.partnerBirth) : {
      dob: "",
      tob: "",
      city: null,
    },
  );
  const [areaOfInquiry, setAreaOfInquiry] = useState("");

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [natalData, setNatalData] = useState<unknown>(null);
  const [partnerNatalData, setPartnerNatalData] = useState<unknown>(null);
  const [aiResults, setAiResults] = useState<
    { key: string; value: unknown; ok: boolean }[]
  >([]);

  const autoFiredRef = useRef(false);

  const canSubmit = useMemo(() => {
    if (!isBirthComplete(person1)) return false;
    if (isTwoPerson && !isBirthComplete(person2)) return false;
    return phase !== "computing";
  }, [person1, person2, isTwoPerson, phase]);

  // Core submit handler — calls compute + AI and stores results
  const runReading = useCallback(async () => {
    if (!canSubmit) return;
    setPhase("computing");
    setError(null);
    setAiResults([]);
    setNatalData(null);
    setPartnerNatalData(null);

    try {
      const birth1 = birthPayload({
        dob: person1.dob,
        tob: person1.tob,
        city: person1.city,
      });

      const natal1 = await callCompute("western_horoscope", birth1);
      setNatalData(natal1);

      let natal2: unknown = null;
      if (isTwoPerson) {
        const birth2 = birthPayload({
          dob: person2.dob,
          tob: person2.tob,
          city: person2.city,
        });
        natal2 = await callCompute("western_horoscope", birth2);
        setPartnerNatalData(natal2);
      }

      // Build AI prompts using the same helper the main page uses. For
      // 2-person tabs this receives the client-only natal — the helper is
      // tolerant of missing data (unmatched prompt slots are skipped),
      // so we degrade gracefully rather than refactor that 3400-line page.
      const prompts = buildAiPrompts(
        natal1 as never,
        props.tabSlug,
        areaOfInquiry || undefined,
      );

      if (Array.isArray(prompts) && prompts.length > 0) {
        // Mirror the real API contract: one callAI per prompt, response
        // comes back on `ai_response` and needs JSON-parse unwrapping.
        const settled = await Promise.all(
          prompts.map(async (p: {
            key: string;
            system: string;
            user: string;
            json: unknown;
          }) => {
            try {
              const aiPayload = {
                condition: { system_content: p.system, user_content: p.user },
                toolname: "other",
                json: p.json,
              };
              const aiRes = await callAI(
                aiPayload,
                areaOfInquiry || undefined,
              );
              return {
                key: p.key,
                value: parseAiJsonResponse(aiRes?.ai_response),
                ok: true,
              };
            } catch (err) {
              return {
                key: p.key,
                value: err instanceof Error ? err.message : "error",
                ok: false,
              };
            }
          }),
        );
        setAiResults(settled);
      }

      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reading failed");
      setPhase("error");
    }
  }, [
    canSubmit,
    person1,
    person2,
    isTwoPerson,
    areaOfInquiry,
    props.tabSlug,
  ]);

  // Auto-fire "Enter" once, on mount, if the form is already valid.
  // Matches the user requirement: "enter clicked automatically".
  useEffect(() => {
    if (autoFiredRef.current) return;
    if (phase !== "idle") return;
    if (!canSubmit) return;
    autoFiredRef.current = true;
    // Small delay so the diviner can see the pre-filled form before compute.
    const t = setTimeout(() => void runReading(), 400);
    return () => clearTimeout(t);
  }, [canSubmit, phase, runReading]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="text-xs uppercase tracking-wider">
              Toolkit Session
            </CardDescription>
            <CardTitle className="text-xl">
              {props.serviceName}
              <Badge variant="secondary" className="ml-2 text-xs">
                {props.tabSlug}
              </Badge>
            </CardTitle>
            <CardDescription>
              {props.clientBirth.fullName
                ? `Reading for ${props.clientBirth.fullName}`
                : "Reading"}{" "}
              — scheduled {formatScheduled(props.scheduledAt)}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/horoscope?tab=${props.tabSlug}`}>
              Open full toolkit <ExternalLink className="ml-1.5 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
      </Card>

      {/* Form — pre-filled, editable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Birth Details</CardTitle>
          <CardDescription>
            Pre-filled from the booking. Edit if needed, then the reading will
            run automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BirthFields
            label={
              isTwoPerson
                ? `Client: ${props.clientBirth.fullName || "—"}`
                : "Client birth data"
            }
            value={person1}
            onChange={setPerson1}
            tobDefaulted={clientTobMissing}
          />

          {isTwoPerson && (
            <>
              {!props.partnerBirth && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Partner birth data wasn&apos;t captured at booking. Fill
                    it in below to generate the reading.
                  </span>
                </div>
              )}
              <BirthFields
                label={`Partner: ${props.partnerBirth?.fullName || ""}`.trim()}
                value={person2}
                onChange={setPerson2}
                tobDefaulted={partnerTobMissing}
              />
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="area">Area of inquiry (optional)</Label>
            <Textarea
              id="area"
              placeholder="E.g. career change, relationship focus..."
              value={areaOfInquiry}
              onChange={(e) => setAreaOfInquiry(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={() => void runReading()}
              disabled={!canSubmit}
              className="min-w-[180px]"
            >
              {phase === "computing" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating reading…
                </>
              ) : phase === "done" ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate reading
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate reading
                </>
              )}
            </Button>
            {phase === "idle" && !canSubmit && (
              <span className="text-xs text-muted-foreground">
                Complete birth data to begin
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertCircle className="h-4 w-4" />
              Reading failed
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {error}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {(natalData || aiResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading</CardTitle>
            <CardDescription>
              Auto-generated summary. For the full interactive chart, open the
              full toolkit.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiResults.map((r) => (
              <div
                key={r.key}
                className={`rounded-md border p-4 text-sm leading-relaxed ${
                  r.ok
                    ? "bg-muted/30"
                    : "border-destructive/40 bg-destructive/5 text-destructive"
                }`}
              >
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {r.key}
                </div>
                {typeof r.value === "string" ? (
                  <div className="whitespace-pre-wrap">{r.value}</div>
                ) : (
                  <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(r.value, null, 2)}
                  </pre>
                )}
              </div>
            ))}
            {natalData && (
              <details className="rounded-md border bg-muted/30 p-3 text-xs">
                <summary className="cursor-pointer font-medium">
                  Raw natal data (debug)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px]">
                  {JSON.stringify(natalData, null, 2)}
                </pre>
              </details>
            )}
            {partnerNatalData && (
              <details className="rounded-md border bg-muted/30 p-3 text-xs">
                <summary className="cursor-pointer font-medium">
                  Partner natal data (debug)
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px]">
                  {JSON.stringify(partnerNatalData, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-component: birth input fields ───────────────────────────────────────

function BirthFields({
  label,
  value,
  onChange,
  tobDefaulted = false,
}: {
  label: string;
  value: BirthInput;
  onChange: (b: BirthInput) => void;
  /** True when the booking didn't capture a birth time and we pre-filled
   *  noon as a fallback. Drives the amber explanatory note. */
  tobDefaulted?: boolean;
}) {
  // City editor state:
  //  - If the booking didn't supply a city (value.city === null) we open the
  //    CityAutocomplete by default so the diviner can search and pick one.
  //  - If the booking already has a city we show a read-only pill with a
  //    pencil "Change" button. Clicking it swaps to the autocomplete so the
  //    diviner can correct bad data without leaving the reading view.
  const [editingCity, setEditingCity] = useState(false);
  const showAutocomplete = !value.city || editingCity;

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <Label htmlFor={`${label}-dob`} className="text-xs">
            Date of Birth
          </Label>
          <Input
            id={`${label}-dob`}
            type="date"
            value={value.dob}
            onChange={(e) => onChange({ ...value, dob: e.target.value })}
            className={!value.dob ? "border-amber-500/60" : undefined}
          />
        </div>
        <div>
          <Label htmlFor={`${label}-tob`} className="text-xs">
            Time of Birth
          </Label>
          <Input
            id={`${label}-tob`}
            type="time"
            value={value.tob}
            onChange={(e) => onChange({ ...value, tob: e.target.value })}
            className={tobDefaulted ? "border-amber-500/60" : undefined}
          />
        </div>
        <div>
          {showAutocomplete ? (
            <CityAutocomplete
              label="Birth City"
              value={value.city}
              onChange={(c) => {
                onChange({ ...value, city: c });
                if (c) setEditingCity(false);
              }}
            />
          ) : (
            <>
              <Label htmlFor={`${label}-city`} className="text-xs">
                Birth City
              </Label>
              <div className="flex gap-1.5">
                <Input
                  id={`${label}-city`}
                  type="text"
                  value={value.city?.label ?? ""}
                  readOnly
                  className="bg-muted/30"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setEditingCity(true)}
                  title="Change birth city"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      {tobDefaulted && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Birth time wasn&apos;t captured at booking — defaulted to{" "}
            <strong>12:00 PM (noon chart)</strong>. Adjust above if the client
            provided a specific time. Houses and rising sign will be
            approximate without a precise birth time.
          </span>
        </div>
      )}
      {!value.city && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Birth city wasn&apos;t captured at booking. Search above and pick
            the correct city from the dropdown — lat/lng and timezone are
            saved automatically.
          </span>
        </div>
      )}
    </div>
  );
}
