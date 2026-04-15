import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Layers,
  Wrench,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  MessageSquare,
} from "lucide-react";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Status helpers ────────────────────────────────────────────────────────────

const BOOKING_STATUS: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  confirmed:   { label: "Confirmed",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", icon: <CheckCircle2 className="size-3" /> },
  completed:   { label: "Completed",   cls: "bg-blue-500/10 text-blue-400 border-blue-500/25",         icon: <CheckCircle2 className="size-3" /> },
  pending:     { label: "Pending",     cls: "bg-amber-500/10 text-amber-400 border-amber-500/25",       icon: <Clock className="size-3" /> },
  canceled:    { label: "Cancelled",   cls: "bg-red-500/10 text-red-400 border-red-500/25",            icon: <XCircle className="size-3" /> },
  no_show:     { label: "No Show",     cls: "bg-orange-500/10 text-orange-400 border-orange-500/25",   icon: <AlertCircle className="size-3" /> },
  in_progress: { label: "In Progress", cls: "bg-violet-500/10 text-violet-400 border-violet-500/25",   icon: <Clock className="size-3" /> },
};

function BookingStatusBadge({ status }: { status: string }) {
  const s = BOOKING_STATUS[status] ?? { label: status, cls: "", icon: null };
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${s.cls}`}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Resolve diviner
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/dashboard");

  // Fetch client
  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("id, user_id, email, full_name, phone, birth_date, birth_time, birth_city")
    .eq("id", id)
    .maybeSingle();

  if (clientErr || !client) notFound();

  // Object-level auth: this diviner must have a relationship with this client
  const { data: relation } = await admin
    .from("client_diviners")
    .select("total_sessions, total_spent, first_session_at, last_session_at, notes")
    .eq("client_id", id)
    .eq("diviner_id", diviner.id)
    .maybeSingle();

  if (!relation) notFound();

  // ── Parallel data fetch ────────────────────────────────────────────────────
  const [bookingsRes, tarotRes, birthChartRes, toolkitRes, testimonialsRes] = await Promise.all([
    // All bookings between this client and diviner
    admin
      .from("bookings")
      .select("id, scheduled_at, status, duration_minutes, total_amount, session_notes, services(name, category)")
      .eq("client_id", id)
      .eq("diviner_id", diviner.id)
      .order("scheduled_at", { ascending: false })
      .limit(50),

    // Tarot readings (by client's auth user)
    client.user_id
      ? admin
          .from("tarot_readings")
          .select("id, spread_name, cards, notes, created_at")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    // Birth charts
    client.user_id
      ? admin
          .from("birth_chart_results")
          .select("id, city_label, birth_day, birth_month, birth_year, chart_url, created_at")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),

    // Astro toolkit readings
    client.user_id
      ? admin
          .from("astro_toolkit_readings")
          .select("id, reading_type, input_data, result_data, created_at")
          .eq("user_id", client.user_id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),

    // Testimonials left for this diviner by this client
    admin
      .from("testimonials")
      .select("id, rating, text, service_type, status, created_at")
      .eq("diviner_id", diviner.id)
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const bookings = (bookingsRes.data ?? []) as any[];
  const tarotReadings = (tarotRes.data ?? []) as any[];
  const birthCharts = (birthChartRes.data ?? []) as any[];
  const toolkitReadings = (toolkitRes.data ?? []) as any[];
  const testimonials = (testimonialsRes.data ?? []) as any[];

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.scheduled_at) >= new Date() && ["confirmed", "pending"].includes(b.status)
  );
  const pastBookings = bookings.filter(
    (b) => !upcomingBookings.includes(b)
  );

  const totalReadings = tarotReadings.length + birthCharts.length + toolkitReadings.length;
  const initials = (client.full_name ?? client.email ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to clients
      </Link>

      {/* ── Hero ── */}
      <div className="rounded-xl border bg-gradient-to-br from-violet-500/10 via-background to-background p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400 text-xl font-bold">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {client.full_name ?? "Unknown Client"}
            </h1>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
              {client.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {client.phone}
                </span>
              )}
              {client.birth_city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {client.birth_city}
                </span>
              )}
              {client.birth_date && (
                <span className="flex items-center gap-1.5">
                  <User className="size-3.5" /> Born {fmtDate(client.birth_date)}
                  {client.birth_time && ` at ${client.birth_time}`}
                </span>
              )}
            </div>

            {/* Notes */}
            {relation.notes && (
              <p className="mt-2 text-sm text-muted-foreground italic">"{relation.notes}"</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border/40">
          {[
            { icon: <Calendar className="size-4 text-blue-400" />, label: "Total Sessions", value: relation.total_sessions ?? 0 },
            { icon: <DollarSign className="size-4 text-emerald-400" />, label: "Total Spent", value: fmt(relation.total_spent ?? 0) },
            { icon: <Clock className="size-4 text-violet-400" />, label: "First Session", value: fmtDate(relation.first_session_at) },
            { icon: <Clock className="size-4 text-amber-400" />, label: "Last Session", value: fmtDate(relation.last_session_at) },
          ].map((s) => (
            <div key={s.label} className="flex items-start gap-2">
              {s.icon}
              <div>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Bookings ── */}
      {upcomingBookings.length > 0 && (
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4 text-emerald-400" />
              Upcoming Sessions
              <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                {upcomingBookings.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {upcomingBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                <div>
                  <p className="text-sm font-medium">{b.services?.name ?? "Session"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtDateTime(b.scheduled_at)} · {b.duration_minutes} min
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold">{fmt(b.total_amount ?? 0)}</span>
                  <BookingStatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── 3-column grid: Past Bookings | Tarot | Birth Charts ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Past Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-4 text-blue-400" />
              Past Sessions
              <Badge variant="outline" className="ml-auto text-[10px]">{pastBookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pastBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No past sessions.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {pastBookings.map((b) => (
                  <div key={b.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{b.services?.name ?? "Session"}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDateTime(b.scheduled_at)}</p>
                        {b.session_notes && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">
                            {b.session_notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-semibold">{fmt(b.total_amount ?? 0)}</span>
                        <BookingStatusBadge status={b.status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarot Readings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="size-4 text-amber-400" />
              Tarot Readings
              <Badge variant="outline" className="ml-auto text-[10px]">{tarotReadings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {tarotReadings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No tarot readings.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {tarotReadings.map((r) => {
                  const cards = Array.isArray(r.cards) ? r.cards : [];
                  return (
                    <div key={r.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{r.spread_name}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtDate(r.created_at)}</p>
                          {cards.length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {cards.slice(0, 3).map((c: any) => c.card_name ?? c.name).filter(Boolean).join(" · ")}
                              {cards.length > 3 ? ` +${cards.length - 3}` : ""}
                            </p>
                          )}
                          {r.notes && (
                            <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-2">
                              {r.notes}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {cards.length} cards
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Birth Charts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="size-4 text-violet-400" />
              Birth Charts
              <Badge variant="outline" className="ml-auto text-[10px]">{birthCharts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {birthCharts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No birth charts.</p>
            ) : (
              <div className="divide-y divide-border/40">
                {birthCharts.map((c) => (
                  <div key={c.id} className="py-2.5 first:pt-0 last:pb-0">
                    <p className="text-xs font-medium">{c.city_label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.birth_day}/{c.birth_month}/{c.birth_year} · {fmtDate(c.created_at)}
                    </p>
                    {c.chart_url && (
                      <a
                        href={c.chart_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-violet-400 hover:underline mt-0.5 inline-block"
                      >
                        View chart →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Astro Toolkit ── */}
      {toolkitReadings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="size-4 text-sky-400" />
              Astro Toolkit Sessions
              <Badge variant="outline" className="ml-auto text-[10px]">{toolkitReadings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {toolkitReadings.map((r) => (
                <div key={r.id} className="rounded-lg border bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {r.reading_type?.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{fmtDate(r.created_at)}</span>
                  </div>
                  {r.input_data && Object.keys(r.input_data).length > 0 && (
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {Object.entries(r.input_data)
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Testimonials ── */}
      {testimonials.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="size-4 text-rose-400" />
              Testimonials
              <Badge variant="outline" className="ml-auto text-[10px]">{testimonials.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${i < (t.rating ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  {t.service_type && (
                    <Badge variant="outline" className="text-[10px]">{t.service_type}</Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ml-auto ${t.status === "approved" ? "text-emerald-400 border-emerald-500/25" : "text-muted-foreground"}`}
                  >
                    {t.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.text}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(t.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state if truly no activity */}
      {totalReadings === 0 && bookings.length === 0 && testimonials.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity recorded for this client yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
