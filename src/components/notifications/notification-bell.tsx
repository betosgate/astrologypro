"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  GraduationCap,
  Flame,
  CreditCard,
  Info,
  AlertCircle,
  Settings,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

// ── Types ─────────────────────────────────────────────────────────────────────

type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "training"
  | "ritual"
  | "billing"
  | "system";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function typeIcon(type: NotificationType) {
  const cls = "h-4 w-4 shrink-0";
  switch (type) {
    case "success":
      return <CheckCircle className={`${cls} text-green-500`} />;
    case "warning":
      return <AlertTriangle className={`${cls} text-yellow-500`} />;
    case "error":
      return <AlertCircle className={`${cls} text-red-500`} />;
    case "training":
      return <GraduationCap className={`${cls} text-blue-500`} />;
    case "ritual":
      return <Flame className={`${cls} text-orange-500`} />;
    case "billing":
      return <CreditCard className={`${cls} text-purple-500`} />;
    case "system":
      return <Settings className={`${cls} text-muted-foreground`} />;
    default:
      return <Info className={`${cls} text-muted-foreground`} />;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ── NotificationItem ──────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification: n, onRead, onDismiss }: NotificationItemProps) {
  const router = useRouter();

  function handleClick() {
    if (!n.is_read) onRead(n.id);
    if (n.action_url) router.push(n.action_url);
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    onDismiss(n.id);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 ${
        !n.is_read ? "bg-primary/5" : ""
      }`}
    >
      <div className="mt-0.5">{typeIcon(n.type)}</div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-tight ${
            !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"
          }`}
        >
          {n.title}
        </p>
        {n.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground/70">
          {relativeTime(n.created_at)}
        </p>
      </div>
      <button
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className="mt-0.5 shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}

// ── NotificationBell (main export) ────────────────────────────────────────────

interface NotificationBellProps {
  userId: string;
}

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Suppress userId lint warning — used in fetch dep array
  void userId;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // silently ignore — bell is non-critical UI
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  async function markAllRead() {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // non-critical
    }
  }

  async function handleRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // non-critical
    }
  }

  async function handleDismiss(id: string) {
    const wasUnread = notifications.find((n) => n.id === id)?.is_read === false;
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // non-critical
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          className="relative"
        >
          <Bell className={`h-5 w-5 ${loading ? "animate-pulse" : ""}`} />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-[360px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={handleRead}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
