import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp, Bell, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { TriggerButton } from "./trigger-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cron Jobs — Admin" };

type JobDef = {
  name: string;
  path: string;
  schedule: string;
  scheduleLabel: string;
  description: string;
  icon: React.ReactNode;
};

const CRON_JOBS: JobDef[] = [
  {
    name: "generate-astro-events",
    path: "/api/cron/generate-astro-events",
    schedule: "0 2 * * *",
    scheduleLabel: "Daily at 2:00 AM UTC",
    description: "Generates mundane astro events (ingresses, stations, aspects) for the next 30 days.",
    icon: <Calendar className="size-4 text-violet-500" />,
  },
  {
    name: "scoring-digest",
    path: "/api/cron/scoring-digest",
    schedule: "0 3 * * 1",
    scheduleLabel: "Mondays at 3:00 AM UTC",
    description: "Computes entity stress scores for all watched entities based on events from the past 7 days.",
    icon: <TrendingUp className="size-4 text-blue-500" />,
  },
  {
    name: "settlement-sweep",
    path: "/api/cron/settlement-sweep",
    schedule: "0 4 * * *",
    scheduleLabel: "Daily at 4:00 AM UTC",
    description: "Settles pending revenue ledger entries that are older than 3 days.",
    icon: <CheckCircle2 className="size-4 text-emerald-500" />,
  },
  {
    name: "alert-check",
    path: "/api/cron/alert-check",
    schedule: "*/30 * * * *",
    scheduleLabel: "Every 30 minutes",
    description: "Checks mundane alert rules and creates in-app notifications when trigger conditions are met.",
    icon: <Bell className="size-4 text-amber-500" />,
  },
];

type RunLogRow = {
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "error";
  result: Record<string, unknown> | null;
  error_message: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function StatusBadge({ status }: { status: "running" | "success" | "error" | null }) {
  if (!status)
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        Never run
      </Badge>
    );
  if (status === "success")
    return (
      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 gap-1">
        <CheckCircle2 className="size-3" /> Success
      </Badge>
    );
  if (status === "error")
    return (
      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 gap-1">
        <AlertCircle className="size-3" /> Error
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 gap-1">
      <Loader2 className="size-3 animate-spin" /> Running
    </Badge>
  );
}

export default async function AdminCronPage() {
  const user = await requireAdmin();
  if (!user) redirect("/login?reason=admin");

  const admin = createAdminClient();

  // Fetch the most recent run for each job
  const { data: logs } = await admin
    .from("cron_run_log")
    .select("job_name, started_at, finished_at, status, result, error_message")
    .in("job_name", CRON_JOBS.map((j) => j.name))
    .order("started_at", { ascending: false });

  // Build a map: job_name -> most recent run
  const lastRunMap = new Map<string, RunLogRow>();
  for (const row of (logs ?? []) as RunLogRow[]) {
    if (!lastRunMap.has(row.job_name)) {
      lastRunMap.set(row.job_name, row);
    }
  }

  // Total counts per job for the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recentCounts } = await admin
    .from("cron_run_log")
    .select("job_name, status")
    .in("job_name", CRON_JOBS.map((j) => j.name))
    .gte("started_at", sevenDaysAgo);

  const runStats = new Map<string, { total: number; errors: number }>();
  for (const row of (recentCounts ?? []) as { job_name: string; status: string }[]) {
    const existing = runStats.get(row.job_name) ?? { total: 0, errors: 0 };
    existing.total++;
    if (row.status === "error") existing.errors++;
    runStats.set(row.job_name, existing);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
        <p className="text-muted-foreground">
          Scheduled background tasks. All times UTC. Manual triggers run against the deployed app URL.
        </p>
      </div>

      {/* Job cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {CRON_JOBS.map((job) => {
          const lastRun = lastRunMap.get(job.name) ?? null;
          const stats = runStats.get(job.name) ?? { total: 0, errors: 0 };

          return (
            <Card key={job.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    {job.icon}
                    <div>
                      <CardTitle className="text-base font-semibold">{job.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" /> {job.scheduleLabel}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{job.description}</p>

                {/* Last run info */}
                <div className="rounded-md border bg-muted/30 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Last run</span>
                    <StatusBadge status={lastRun?.status ?? null} />
                  </div>
                  {lastRun ? (
                    <>
                      <p className="text-xs font-medium">{formatDate(lastRun.started_at)}</p>
                      {lastRun.result && (
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {JSON.stringify(lastRun.result)}
                        </p>
                      )}
                      {lastRun.error_message && (
                        <p className="text-xs text-red-600 truncate">{lastRun.error_message}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">No runs recorded yet</p>
                  )}
                </div>

                {/* 7-day stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>7d runs: <strong className="text-foreground">{stats.total}</strong></span>
                  {stats.errors > 0 && (
                    <span className="text-red-600">
                      Errors: <strong>{stats.errors}</strong>
                    </span>
                  )}
                </div>

                {/* Manual trigger */}
                <div className="pt-1 border-t">
                  <TriggerButton jobPath={job.path} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cron schedule reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule Reference</CardTitle>
          <CardDescription>All cron expressions in cron syntax (UTC)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Job</th>
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Cron Expression</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {CRON_JOBS.map((job) => (
                  <tr key={job.name}>
                    <td className="py-2 pr-4 font-mono text-xs">{job.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{job.schedule}</td>
                    <td className="py-2 text-xs text-muted-foreground">{job.scheduleLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
