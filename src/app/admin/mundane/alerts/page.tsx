"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, BellOff, Plus, Trash2, CheckCheck, Loader2, AlertTriangle,
  Info, AlertCircle, ShieldAlert, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Rule = any;

const PRIORITY_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === "critical") return <ShieldAlert className="size-4 text-red-500" />;
  if (priority === "high") return <AlertTriangle className="size-4 text-orange-500" />;
  if (priority === "medium") return <AlertCircle className="size-4 text-yellow-500" />;
  return <Info className="size-4 text-gray-400" />;
}

const RULE_TYPES = [
  { value: "eclipse_on_entity", label: "Eclipse on Entity Chart Point" },
  { value: "ingress_angular", label: "Ingress Activates Angular Position" },
  { value: "leader_chart_hit", label: "Transit Hits Leader Natal Chart" },
  { value: "event_cluster", label: "Event Cluster Detected" },
  { value: "forecast_window_open", label: "Forecast Window Opening" },
  { value: "custom", label: "Custom Rule" },
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function AlertCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [loadingRules, setLoadingRules] = useState(true);
  const [activeTab, setActiveTab] = useState<"notifications" | "rules">("notifications");

  // New rule form
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState("custom");
  const [newRulePriority, setNewRulePriority] = useState("medium");
  const [savingRule, setSavingRule] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/mundane/alerts/notifications?limit=30");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await fetch("/api/mundane/alerts/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules ?? []);
      }
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    loadRules();
  }, [loadNotifications, loadRules]);

  async function markRead(id: string) {
    await fetch(`/api/mundane/alerts/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) =>
      fetch(`/api/mundane/alerts/notifications/${n.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      })
    ));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  }

  async function dismissNotification(id: string) {
    await fetch(`/api/mundane/alerts/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  async function toggleRule(id: string, is_active: boolean) {
    const res = await fetch(`/api/mundane/alerts/rules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    if (res.ok) {
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, is_active: !is_active } : r));
    }
  }

  async function createRule() {
    if (!newRuleName.trim()) { toast.error("Rule name is required"); return; }
    setSavingRule(true);
    try {
      const res = await fetch("/api/mundane/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRuleName.trim(),
          rule_type: newRuleType,
          priority: newRulePriority,
          delivery_channels: ["in_app"],
          conditions: {},
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed");
      const rule = await res.json();
      setRules((prev) => [rule, ...prev]);
      setNewRuleName("");
      setNewRuleType("custom");
      setNewRulePriority("medium");
      setShowNewRule(false);
      toast.success("Alert rule created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create rule");
    } finally {
      setSavingRule(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Bell className="size-6 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight">Alert Center</h1>
          {unreadCount > 0 && (
            <Badge className="bg-amber-500 text-white border-amber-500">{unreadCount}</Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1">Notifications and alert rules for mundane watch signals.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-0">
        {(["notifications", "rules"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "notifications" ? `Notifications ${unreadCount > 0 ? `(${unreadCount})` : ""}` : "Alert Rules"}
          </button>
        ))}
      </div>

      {/* Notifications tab */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          {/* Actions bar */}
          {notifications.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="size-4 mr-1.5" />Mark All Read
              </Button>
            </div>
          )}

          {loadingNotifs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <BellOff className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Alerts will appear here when eclipse paths, ingresses, or forecast windows match your watchlisted entities.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`transition-colors ${n.is_read ? "opacity-60" : "border-amber-200/60 bg-amber-50/30"}`}
                >
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <PriorityIcon priority={n.priority} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{n.title}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${PRIORITY_BADGE[n.priority] ?? ""}`}>
                          {n.priority}
                        </Badge>
                      </div>
                      {n.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{fmtDateTime(n.triggered_at)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => markRead(n.id)} title="Mark read">
                          <Eye className="size-3.5" />
                        </Button>
                      )}
                      {n.is_read && (
                        <EyeOff className="size-3.5 text-muted-foreground/40 mt-2" />
                      )}
                      <Button variant="ghost" size="icon" className="size-7 text-destructive/60 hover:text-destructive" onClick={() => dismissNotification(n.id)} title="Dismiss">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alert Rules tab */}
      {activeTab === "rules" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNewRule((v) => !v)}>
              <Plus className="size-4 mr-1.5" />New Rule
            </Button>
          </div>

          {showNewRule && (
            <Card className="border-dashed">
              <CardHeader><CardTitle className="text-sm">New Alert Rule</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-medium">Rule Name *</label>
                    <Input
                      placeholder="e.g. Eclipse on US natal Moon"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Rule Type</label>
                    <Select value={newRuleType} onValueChange={setNewRuleType}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {RULE_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Priority</label>
                    <Select value={newRulePriority} onValueChange={setNewRulePriority}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["low", "medium", "high", "critical"].map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={createRule} disabled={savingRule}>
                    {savingRule ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Plus className="size-4 mr-1.5" />}
                    Create Rule
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowNewRule(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingRules ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <Bell className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No alert rules yet.</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Create rules to be notified when specific astrological conditions trigger on your watched entities.
                </p>
                <Button size="sm" onClick={() => setShowNewRule(true)}>
                  <Plus className="size-4 mr-1.5" />Create First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map((r) => (
                <Card key={r.id} className={r.is_active ? "" : "opacity-50"}>
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <PriorityIcon priority={r.priority} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {RULE_TYPES.find((t) => t.value === r.rule_type)?.label ?? r.rule_type}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE[r.priority] ?? ""}`}>
                          {r.priority}
                        </Badge>
                        {!r.is_active && (
                          <Badge variant="outline" className="text-[10px] text-gray-400">Paused</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRule(r.id, r.is_active)}
                      className="shrink-0 text-xs"
                    >
                      {r.is_active ? (
                        <><BellOff className="size-3.5 mr-1" />Pause</>
                      ) : (
                        <><Bell className="size-3.5 mr-1" />Enable</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
