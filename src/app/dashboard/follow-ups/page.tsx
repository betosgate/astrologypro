import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Follow-ups",
};

const EMAIL_TYPE_LABELS: Record<string, { label: string; description: string }> =
  {
    recording_ready: {
      label: "Recording Ready",
      description: "Sent when the session recording is ready to view",
    },
    reflection: {
      label: "Reflection",
      description: "Sent a few days after the session to prompt reflection",
    },
    rebooking: {
      label: "Rebooking",
      description: "Sent to encourage clients to book their next session",
    },
  };

const stepLabels: Record<number, string> = {
  1: "Immediate",
  2: "3 days",
  3: "30 days",
};

export default async function FollowUpsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  const { data: sequences } = await supabase
    .from("follow_up_sequences")
    .select(
      "id, step, scheduled_at, sent_at, email_type, created_at, bookings(id, scheduled_at), clients(full_name, email)"
    )
    .eq("diviner_id", diviner.id)
    .order("scheduled_at", { ascending: false })
    .limit(100);

  const all = sequences ?? [];
  const sentCount = all.filter((s) => s.sent_at).length;
  const pendingCount = all.filter((s) => !s.sent_at).length;

  const byType = Object.entries(EMAIL_TYPE_LABELS).map(([type, meta]) => ({
    type,
    ...meta,
    count: all.filter((s) => s.email_type === type).length,
    sent: all.filter((s) => s.email_type === type && s.sent_at).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
        <p className="text-muted-foreground">
          Automated emails sent to clients after their sessions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Queued</CardDescription>
            <CardTitle className="text-3xl">{all.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-3xl text-green-500">{sentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Email type summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {byType.map((t) => (
          <Card key={t.type}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">{t.label}</CardTitle>
              </div>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t.sent} sent / {t.count} total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sequence log */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Log</CardTitle>
          <CardDescription>
            Most recent 100 follow-up emails, sent and pending.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No follow-up emails yet. They are automatically scheduled when
                sessions complete.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((seq) => {
                  const typeInfo = EMAIL_TYPE_LABELS[seq.email_type] ?? {
                    label: seq.email_type,
                  };
                  const client = (seq.clients as unknown) as
                    | { full_name: string | null; email: string }
                    | null
                    | undefined;
                  return (
                    <TableRow key={seq.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {client?.full_name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {client?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stepLabels[seq.step] ?? `Step ${seq.step}`}
                        </span>
                      </TableCell>
                      <TableCell>{formatDateTime(seq.scheduled_at)}</TableCell>
                      <TableCell>
                        {seq.sent_at ? (
                          <div className="flex items-center gap-1.5 text-green-500">
                            <CheckCircle2 className="size-4" />
                            <span className="text-sm">
                              Sent {formatDate(seq.sent_at)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-yellow-500">
                            <Clock className="size-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
