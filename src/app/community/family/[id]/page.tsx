"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NatalWheel } from "@/components/community/natal-wheel";
import { ProgressRing } from "@/components/community/progress-ring";
import { calcFamilyProfileCompletion } from "@/lib/community/family-profile-completion";
import {
  ArrowLeft,
  RefreshCw,
  Info,
  Loader2,
  Star,
  Pencil,
  Mail,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { formatBirthPlace } from "@/lib/community/birth-location";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanetPosition = {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  retrograde: boolean;
};

type NatalChartData = {
  planets: PlanetPosition[];
  ascendant: { sign: string; degree: number; longitude: number } | null;
  mc: { sign: string; degree: number; longitude: number } | null;
  generatedAt: string;
  birthTime: string | null;
  ageGroup: "child" | "adult";
};

type FamilyMember = {
  id: string;
  full_name: string;
  date_of_birth: string;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
  relationship: string | null;
  age_group: "child" | "adult";
  natal_chart: NatalChartData | null;
  chart_updated_at: string | null;
  notes: string | null;
  // invite fields
  invite_email: string | null;
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
  user_id: string | null;
};

// ---------------------------------------------------------------------------
// Astrology lookup tables
// ---------------------------------------------------------------------------

const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀",
  Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅",
  Neptune: "♆", Pluto: "♇",
};

const PLANET_DESCRIPTIONS: Record<string, string> = {
  Sun: "Core identity and ego",
  Moon: "Emotions and subconscious",
  Mercury: "Communication and intellect",
  Venus: "Love, beauty and values",
  Mars: "Drive, energy and action",
  Jupiter: "Growth, luck and expansion",
  Saturn: "Structure, karma and discipline",
  Uranus: "Innovation and sudden change",
  Neptune: "Dreams, spirituality and illusion",
  Pluto: "Transformation and power",
};

const ELEMENT: Record<string, string> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

const MODALITY: Record<string, string> = {
  Aries: "Cardinal", Taurus: "Fixed", Gemini: "Mutable", Cancer: "Cardinal",
  Leo: "Fixed", Virgo: "Mutable", Libra: "Cardinal", Scorpio: "Fixed",
  Sagittarius: "Mutable", Capricorn: "Cardinal", Aquarius: "Fixed", Pisces: "Mutable",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InviteStatus({ member }: { member: FamilyMember }) {
  if (member.relationship?.toLowerCase() === "self") return null;

  if (member.user_id && member.invite_accepted_at) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <CheckCircle2 className="size-3.5" />
        Login activated on {formatDate(member.invite_accepted_at)}
      </div>
    );
  }
  if (member.invite_sent_at) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-600">
        <Mail className="size-3.5" />
        Invite sent {formatDate(member.invite_sent_at)}
        {member.invite_email && ` to ${member.invite_email}`}
      </div>
    );
  }
  return (
    <div className="text-xs text-muted-foreground">Not yet invited to log in</div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function FamilyMemberChartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    const res = await fetch("/api/community/family");
    if (!res.ok) return;
    const data = await res.json();
    const found = (data.members ?? []).find((m: FamilyMember) => m.id === id);
    if (!found) {
      router.replace("/community/family");
      return;
    }
    setMember(found);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMember();
  }, [loadMember]);

  async function generateChart() {
    setGenerating(true);
    setError(null);
    const res = await fetch("/api/community/generate-natal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyMemberId: id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Chart generation failed");
    } else {
      await loadMember();
    }
    setGenerating(false);
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    setSendingInvite(true);
    setInviteError(null);
    const res = await fetch(`/api/community/family/${id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error ?? "Failed to send invite");
    } else {
      setInviteSuccess(true);
      setShowInviteInput(false);
      await loadMember();
    }
    setSendingInvite(false);
  }

  // ---------------------------------------------------------------------------
  // Loading / empty guard
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) return null;

  const chart = member.natal_chart;
  const dob = new Date(member.date_of_birth + "T12:00:00");
  const ageYears = Math.floor(
    (nowMs - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
  );

  // Profile completion
  const completion = calcFamilyProfileCompletion({
    full_name: member.full_name,
    date_of_birth: member.date_of_birth,
    birth_time: member.birth_time,
    birth_city: member.birth_city,
    birth_country: member.birth_country,
    relationship: member.relationship,
    natal_chart: member.natal_chart,
  });

  const ringColor =
    completion.percent >= 80
      ? "hsl(142, 71%, 45%)"
      : completion.percent >= 50
      ? "hsl(var(--primary))"
      : "hsl(25, 90%, 55%)";

  const hasBirthCoordinates =
    Number.isFinite(Number(member.birth_lat)) &&
    Number.isFinite(Number(member.birth_lng));
  const hasBirthDataForChart =
    Boolean(member.date_of_birth && member.birth_city && member.birth_country) &&
    hasBirthCoordinates;
  const hasBirthPlaceWithoutCoordinates =
    Boolean(member.birth_city || member.birth_country) && !hasBirthCoordinates;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/community/family">
              <ArrowLeft className="mr-1.5 size-4" />
              Family
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {member.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {member.relationship ? `${member.relationship} · ` : ""}Age {ageYears} ·{" "}
              {member.age_group === "child" ? "Simplified chart" : "Full natal chart"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/community/family/${id}/edit`}>
              <Pencil className="mr-1.5 size-4" />
              Edit Details
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateChart}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 size-4" />
            )}
            {chart ? "Regenerate" : "Generate Chart"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Profile Details + Completion ───────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Birth details card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Birth Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of birth</span>
              <span>
                {dob.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Birth time</span>
              {member.birth_time ? (
                <span>{member.birth_time}</span>
              ) : (
                <span className="text-amber-600 text-xs">Unknown</span>
              )}
            </div>
            {(member.birth_city || member.birth_country) && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Birth place</span>
                <span>{formatBirthPlace(member.birth_city, member.birth_country)}</span>
              </div>
            )}
            {member.relationship && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Relationship</span>
                <span>{member.relationship}</span>
              </div>
            )}
            {member.notes && (
              <div className="pt-1">
                <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                <p className="text-xs">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile completion + chart status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Profile Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <ProgressRing
                percentage={completion.percent}
                size={64}
                strokeWidth={6}
                color={ringColor}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium">{completion.percent}% complete</p>
                {completion.missing.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Missing:{" "}
                    {completion.missing
                      .filter((m) => m !== "Natal chart generated")
                      .join(", ") || "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Chart status chip */}
            <div className="flex items-center gap-2">
              {chart ? (
                <Badge className="bg-green-500/15 text-green-700 border-green-500/30 hover:bg-green-500/20">
                  Chart Ready ✓
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-400/50 text-amber-700 bg-amber-50/50"
                >
                  Chart Pending
                </Badge>
              )}
              {chart?.generatedAt && (
                <span className="text-xs text-muted-foreground">
                  Generated {formatDate(chart.generatedAt)}
                </span>
              )}
            </div>

            {!chart && hasBirthDataForChart && (
              <Button
                size="sm"
                variant="outline"
                onClick={generateChart}
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Star className="mr-2 size-4" />
                )}
                Generate Chart Now
              </Button>
            )}
            {!chart && hasBirthPlaceWithoutCoordinates && (
              <div className="rounded-md border border-amber-400/30 bg-amber-50/50 px-3 py-2 text-xs text-amber-800">
                Select the birth city from suggestions before generating a chart.{" "}
                <Link
                  href={`/community/family/${id}/edit`}
                  className="font-medium underline hover:text-amber-900"
                >
                  Edit birth place
                </Link>
              </div>
            )}

            {/* Invite status */}
            {member.relationship?.toLowerCase() !== "self" && (
              <div className="border-t pt-2 space-y-2">
                <InviteStatus member={member} />
                {!member.user_id && !showInviteInput && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-primary"
                    onClick={() => setShowInviteInput(true)}
                  >
                    <Mail className="mr-1.5 size-3" />
                    Send Login Invite
                  </Button>
                )}
                {showInviteInput && (
                  <div className="space-y-2">
                    <input
                      type="email"
                      className="w-full rounded-md border px-2 py-1.5 text-xs bg-background"
                      placeholder="Email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    {inviteError && (
                      <p className="text-xs text-destructive">{inviteError}</p>
                    )}
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={sendInvite}
                        disabled={sendingInvite || !inviteEmail}
                      >
                        {sendingInvite && (
                          <Loader2 className="mr-1 size-3 animate-spin" />
                        )}
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setShowInviteInput(false);
                          setInviteEmail("");
                          setInviteError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                {inviteSuccess && (
                  <p className="text-xs text-green-600">
                    Invite sent successfully.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Birth time warning ──────────────────────────────────────────── */}
      {!member.birth_time && (
        <Card className="border-amber-400/30 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Birth time missing</p>
              <p className="text-sm text-amber-700">
                Add a birth time for greater accuracy — the ascendant and house
                positions cannot be calculated without it.{" "}
                <Link
                  href={`/community/family/${id}/edit`}
                  className="underline hover:text-amber-900"
                >
                  Edit profile →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── No chart yet ────────────────────────────────────────────────── */}
      {!chart && !generating && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Star className="size-8 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No chart generated yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click &quot;Generate Chart&quot; to calculate{" "}
                {member.full_name}&apos;s natal chart.
              </p>
            </div>
            <Button onClick={generateChart} disabled={generating}>
              Generate Natal Chart
            </Button>
          </CardContent>
        </Card>
      )}

      {generating && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Calculating positions…</p>
          </CardContent>
        </Card>
      )}

      {/* ── Chart ───────────────────────────────────────────────────────── */}
      {chart && !generating && (
        <>
          {/* Visual wheel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Natal Chart Wheel</CardTitle>
              <CardDescription>
                {member.birth_time
                  ? `Born ${dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} at ${member.birth_time}`
                  : `Born ${dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} (time unknown)`}
                {(member.birth_city || member.birth_country) &&
                  ` · ${formatBirthPlace(member.birth_city, member.birth_country)}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <NatalWheel
                planets={chart.planets}
                ascendantLon={chart.ascendant?.longitude ?? null}
                size={380}
              />
            </CardContent>
          </Card>

          {/* Ascendant & MC — adult only */}
          {chart.ageGroup === "adult" && (chart.ascendant || chart.mc) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {chart.ascendant && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Rising Sign (Ascendant)</CardDescription>
                    <CardTitle className="text-2xl">{chart.ascendant.sign}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {chart.ascendant.degree.toFixed(1)}° ·{" "}
                      {ELEMENT[chart.ascendant.sign]} · {MODALITY[chart.ascendant.sign]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your outward expression and first impressions
                    </p>
                  </CardContent>
                </Card>
              )}
              {chart.mc && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Midheaven (MC)</CardDescription>
                    <CardTitle className="text-2xl">{chart.mc.sign}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {chart.mc.degree.toFixed(1)}° · {ELEMENT[chart.mc.sign]} ·{" "}
                      {MODALITY[chart.mc.sign]}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Career path and public reputation
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Planet placements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Planet Placements
                {chart.ageGroup === "child" && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Simplified (age &lt; 14)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Where each planet was at the moment of birth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {chart.planets.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3"
                  >
                    <span className="text-2xl leading-none mt-0.5">
                      {PLANET_GLYPHS[p.name] ?? "●"}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm">{p.name}</span>
                        <span className="text-sm text-muted-foreground">in</span>
                        <span className="font-semibold text-sm">{p.sign}</span>
                        {p.retrograde && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            ℞
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {p.degree.toFixed(1)}° · {ELEMENT[p.sign]} ·{" "}
                        {MODALITY[p.sign]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PLANET_DESCRIPTIONS[p.name] ?? ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Chart generated{" "}
            {new Date(chart.generatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {!member.birth_time &&
              " · Birth time unknown — ascendant not shown"}
          </p>
        </>
      )}
    </div>
  );
}
