"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FilterX, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TicketsPageActions() {
  const router = useRouter();
  const [isRefreshing, startRefreshing] = useTransition();

  function handleReset() {
    router.push("/admin/tickets");
  }

  function handleRefresh() {
    startRefreshing(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <FilterX className="size-4" />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="gap-1.5"
      >
        <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
        {isRefreshing ? "Reloading…" : "Reload"}
      </Button>
      <Button size="sm" asChild>
        <Link href="/admin/tickets/new">
          <Plus className="size-4 mr-2" />
          Create Job Ticket
        </Link>
      </Button>
    </div>
  );
}
