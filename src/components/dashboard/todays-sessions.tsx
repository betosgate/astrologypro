"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, PlayCircle, FileText, Calendar, ArrowUpRight } from "lucide-react";

interface TodaySession {
  id: string;
  scheduled_at: string;
  client_name: string;
  service_name: string;
}

interface TodaysSessionsProps {
  sessions: TodaySession[];
  nextSessionDate: string | null;
}

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Starting now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`Starts in ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`Starts in ${minutes}m`);
      }
    }

    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

function SessionRow({ session }: { session: TodaySession }) {
  const countdown = useCountdown(session.scheduled_at);
  const time = new Date(session.scheduled_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{session.client_name}</p>
        <p className="text-xs text-muted-foreground">
          {session.service_name} &middot; {time}
        </p>
        <p
          className="text-xs font-medium"
          style={{ color: "#d4a017" }}
        >
          <Clock className="mr-1 inline size-3" />
          {countdown}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dashboard/bookings?prep=${session.id}`}>
            <FileText className="mr-1 size-3" />
            Prepare
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href={`/session/${session.id}`}>
            <PlayCircle className="mr-1 size-3" />
            Start Session
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function TodaysSessions({
  sessions,
  nextSessionDate,
}: TodaysSessionsProps) {
  return (
    <Card className="border-amber-500/30 shadow-[0_0_15px_-3px_rgba(212,160,23,0.15)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-5" style={{ color: "#d4a017" }} />
          Today&apos;s Sessions
        </CardTitle>
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View All
          <ArrowUpRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            No sessions scheduled today.
            {nextSessionDate && (
              <>
                {" "}
                Your next session is{" "}
                <span className="font-medium text-foreground">
                  {new Date(nextSessionDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                .
              </>
            )}
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
