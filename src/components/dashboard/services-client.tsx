"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import {
  ASTROLOGY_TEMPLATES,
  TAROT_TEMPLATES,
  type ServiceTemplate,
} from "@/lib/service-templates";
import type { ResolvedRoleServicePackage } from "@/lib/role-service-packages.shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  // Used for actions
  Plus,
  Check,
  Clock,
  DollarSign,
  Loader2,
  Trash2,
  Sparkles,
  Star,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  GripVertical,
  AlertTriangle,
  CalendarCheck,
  CalendarPlus,
  // Thumbnail icons — Astrology
  Sun,
  Sunrise,
  CalendarDays,
  Moon,
  Heart,
  Users,
  Briefcase,
  Eye,
  Zap,
  Circle,
  Flame,
  // Thumbnail icons — Tarot
  Layers,
  LayoutGrid,
  TrendingUp,
  Anchor,
  HeartHandshake,
  Cross,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";

// ── Icon map (lucide name → component) ───────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Sun, Sunrise, CalendarDays, Moon, Heart, Users, Briefcase, Eye, Zap, Circle,
  Flame, Layers, LayoutGrid, TrendingUp, Anchor, HeartHandshake, Cross, CircleDot,
  // Bolt falls back to Zap (not in lucide as "Bolt")
  Bolt: Zap,
};

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  indigo:  { bg: "bg-indigo-500/15",  text: "text-indigo-400",  ring: "ring-indigo-500/20" },
  violet:  { bg: "bg-violet-500/15",  text: "text-violet-400",  ring: "ring-violet-500/20" },
  amber:   { bg: "bg-amber-500/15",   text: "text-amber-400",   ring: "ring-amber-500/20" },
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-400", ring: "ring-emerald-500/20" },
  sky:     { bg: "bg-sky-500/15",     text: "text-sky-400",     ring: "ring-sky-500/20" },
  rose:    { bg: "bg-rose-500/15",    text: "text-rose-400",    ring: "ring-rose-500/20" },
  teal:    { bg: "bg-teal-500/15",    text: "text-teal-400",    ring: "ring-teal-500/20" },
  orange:  { bg: "bg-orange-500/15",  text: "text-orange-400",  ring: "ring-orange-500/20" },
  lime:    { bg: "bg-lime-500/15",    text: "text-lime-400",    ring: "ring-lime-500/20" },
};

// ── Thumbnail ─────────────────────────────────────────────────────────────────

function ServiceThumbnail({
  iconName,
  color,
  size = "md",
}: {
  iconName: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = ICON_MAP[iconName] ?? Sparkles;
  const c = COLOR_CLASSES[color] ?? COLOR_CLASSES.indigo;
  const sizeClasses = { sm: "size-9", md: "size-12", lg: "size-14" };
  const iconSize = { sm: "size-4", md: "size-5", lg: "size-6" };
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl ring-1 ${sizeClasses[size]} ${c.bg} ${c.ring}`}
    >
      <Icon className={`${iconSize[size]} ${c.text}`} />
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExistingService {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface ServicesClientProps {
  services: ExistingService[];
  resolvedPackage: ResolvedRoleServicePackage;
}

// ── Add Service Modal ─────────────────────────────────────────────────────────

interface AddModalState {
  template: ServiceTemplate;
  price: string;
}

function AddServiceModal({
  state,
  onClose,
  onAdded,
}: {
  state: AddModalState | null;
  onClose: () => void;
  onAdded: (serviceName: string) => void;
}) {
  const [price, setPrice] = useState(state?.price ?? "");
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!state) return;
    const parsed = parseFloat(price);
    if (isNaN(parsed) || parsed < 0) {
      setError("Please enter a valid price (0 or more).");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/dashboard/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_slug: state.template.key,
            name: state.template.name,
            category: state.template.category,
            description: state.template.description,
            duration_minutes: state.template.duration_minutes,
            base_price: parsed,
            requires_birth_data: state.template.requires_birth_data,
            is_active: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail ?? "Failed to add service");
        onAdded(state.template.name);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={!!state} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Set your price for{" "}
            <span className="font-medium text-foreground">{state?.template.name}</span>.
            You can update it anytime.
          </DialogDescription>
        </DialogHeader>

        {state && (
          <div className="space-y-4">
            {/* Template preview */}
            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
              <ServiceThumbnail iconName={state.template.icon} color={state.template.color} size="sm" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {state.template.duration_minutes} min
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{state.template.category}</Badge>
                  {state.template.requires_birth_data && (
                    <span className="text-amber-500 text-[10px]">Requires birth data</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{state.template.description}</p>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label htmlFor="service-price">Your Price (USD)</Label>
              <div className="relative">
                <DollarSign className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8"
                  placeholder={state.template.suggested_price.toString()}
                  value={price}
                  onChange={(e) => { setPrice(e.target.value); setError(null); }}
                />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Suggested: {formatCurrency(state.template.suggested_price)}
                </p>
                <button
                  type="button"
                  className="text-xs text-primary underline-offset-2 hover:underline"
                  onClick={() => { setPrice(state.template.suggested_price.toString()); setError(null); }}
                >
                  Use default
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleAdd} disabled={loading}>
            {loading ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Plus className="mr-1.5 size-4" />}
            Add Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isAdded,
  onAdd,
}: {
  template: ServiceTemplate;
  isAdded: boolean;
  onAdd: (t: ServiceTemplate) => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-4 transition-colors ${
        isAdded
          ? "border-green-500/30 bg-green-500/5"
          : "border-border bg-card hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      {isAdded && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-green-500/20">
          <Check className="size-3 text-green-500" />
        </span>
      )}

      {/* Thumbnail + title */}
      <div className="flex items-start gap-3 pr-6">
        <ServiceThumbnail iconName={template.icon} color={template.color} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold leading-snug">{template.name}</h4>
          <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="size-3" />{template.duration_minutes} min</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1"><DollarSign className="size-3" />from {formatCurrency(template.suggested_price)}</span>
            {template.requires_birth_data && (
              <><span className="text-muted-foreground/40">·</span><span className="text-amber-500">birth data</span></>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
        {template.description}
      </p>

      {/* CTA */}
      <div className="mt-3">
        {isAdded ? (
          <span className="text-xs font-medium text-green-600">Added to your services</span>
        ) : (
          <Button size="sm" className="w-full text-xs" onClick={() => onAdd(template)}>
            <Plus className="mr-1 size-3" />
            Add Service
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ServicesClient({ services: initialServices, resolvedPackage }: ServicesClientProps) {
  const router = useRouter();
  const [services, setServices] = useState<ExistingService[]>(
    [...initialServices].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [addModal, setAddModal] = useState<AddModalState | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Track which services have availability set up
  const [serviceAvailability, setServiceAvailability] = useState<Record<string, boolean>>({});
  const [hasGlobalAvailability, setHasGlobalAvailability] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  const loadAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/availability");
      if (!res.ok) return;
      const { templates } = await res.json();
      const map: Record<string, boolean> = {};
      let hasGlobal = false;
      for (const t of templates ?? []) {
        if (t.is_active) {
          if (t.service_id) {
            map[t.service_id] = true;
          } else {
            hasGlobal = true;
          }
        }
      }
      setServiceAvailability(map);
      setHasGlobalAvailability(hasGlobal);
      setAvailabilityLoaded(true);
    } catch {
      // Silently fail — availability check is non-critical
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const addedNames = new Set(services.map((s) => s.name.toLowerCase()));

  function openAddModal(template: ServiceTemplate) {
    setAddModal({ template, price: template.suggested_price.toString() });
  }

  async function toggleActive(service: ExistingService) {
    setTogglingId(service.id);
    try {
      const res = await fetch(`/api/dashboard/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setServices((prev) =>
        prev.map((s) => s.id === service.id ? { ...s, is_active: !s.is_active } : s)
      );
      toast.success(`"${service.name}" ${!service.is_active ? "activated" : "deactivated"}`);
    } catch {
      toast.error("Could not update service");
    } finally {
      setTogglingId(null);
    }
  }

  async function removeService(service: ExistingService) {
    if (!confirm(`Remove "${service.name}" from your services?`)) return;
    setRemovingId(service.id);
    try {
      const res = await fetch(`/api/dashboard/services/${service.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      toast.success(`"${service.name}" removed`);
    } catch {
      toast.error("Could not remove service");
    } finally {
      setRemovingId(null);
    }
  }

  async function moveService(id: string, direction: "up" | "down") {
    const idx = services.findIndex((s) => s.id === id);
    if (idx < 0) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === services.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...services];
    // Swap sort_order values
    const tempOrder = updated[idx].sort_order;
    updated[idx] = { ...updated[idx], sort_order: updated[swapIdx].sort_order };
    updated[swapIdx] = { ...updated[swapIdx], sort_order: tempOrder };
    // Swap positions in array
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    setServices(updated);

    setReorderingId(id);
    try {
      // Persist both affected services
      await Promise.all([
        fetch(`/api/dashboard/services/${updated[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: updated[swapIdx].sort_order }),
        }),
        fetch(`/api/dashboard/services/${updated[idx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: updated[idx].sort_order }),
        }),
      ]);
    } catch {
      toast.error("Could not save order");
      setServices(initialServices); // revert
    } finally {
      setReorderingId(null);
    }
  }

  // Find the matching template for a given service name (for the thumbnail)
  function getTemplate(serviceName: string): ServiceTemplate | undefined {
    return [...ASTROLOGY_TEMPLATES, ...TAROT_TEMPLATES].find(
      (t) => t.name.toLowerCase() === serviceName.toLowerCase()
    );
  }

  const showAstrology = resolvedPackage.allowsAstrology;
  const showTarot = resolvedPackage.allowsTarot;

  return (
    <>
      <AddServiceModal
        state={addModal}
        onClose={() => setAddModal(null)}
        onAdded={(serviceName: string) => {
          toast.success(`"${serviceName}" added`, {
            description: "Set up availability so clients can book this service.",
            action: {
              label: "Set Availability",
              onClick: () => router.push("/dashboard/availability"),
            },
            duration: 8000,
          });
          router.refresh();
          loadAvailability();
        }}
      />

      <div className="space-y-8">
        {/* ── Service Catalog ───────────────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Service Catalog</h2>
            <p className="text-sm text-muted-foreground">
              Choose from the available service types. Click "Add Service" to set your price and publish it on your profile.
            </p>
          </div>

          {showAstrology && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="font-medium">Astrology Services</h3>
                <Badge variant="secondary" className="text-xs">{ASTROLOGY_TEMPLATES.length} available</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ASTROLOGY_TEMPLATES.map((t) => (
                  <TemplateCard
                    key={t.key}
                    template={t}
                    isAdded={addedNames.has(t.name.toLowerCase())}
                    onAdd={openAddModal}
                  />
                ))}
              </div>
            </div>
          )}

          {showTarot && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-primary" />
                <h3 className="font-medium">Tarot Toolkit</h3>
                <Badge variant="secondary" className="text-xs">{TAROT_TEMPLATES.length} available</Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {TAROT_TEMPLATES.map((t) => (
                  <TemplateCard
                    key={t.key}
                    template={t}
                    isAdded={addedNames.has(t.name.toLowerCase())}
                    onAdd={openAddModal}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Availability Warning Banner ─────────────────────────────── */}
        {availabilityLoaded && services.length > 0 && (() => {
          const servicesWithoutAvailability = services.filter(
            (s) => s.is_active && !serviceAvailability[s.id]
          );
          if (servicesWithoutAvailability.length === 0) return null;
          return (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-600">
                  {servicesWithoutAvailability.length} service{servicesWithoutAvailability.length > 1 ? "s" : ""} without availability
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clients cannot book {servicesWithoutAvailability.length > 1 ? "these services" : `"${servicesWithoutAvailability[0].name}"`} until you set up availability.
                </p>
              </div>
              <Link href="/dashboard/availability">
                <Button size="sm" variant="outline" className="shrink-0 border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                  <CalendarPlus className="mr-1.5 size-3.5" />
                  Set Availability
                </Button>
              </Link>
            </div>
          );
        })()}

        {/* ── Your Services ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Your Active Services</CardTitle>
              <CardDescription>
                {services.length} service{services.length !== 1 ? "s" : ""} on your profile
                {services.length > 1 && (
                  <span className="ml-1 text-muted-foreground/70">
                    — use <GripVertical className="inline size-3" /> arrows to reorder how they appear to clients
                  </span>
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">No services yet</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Add services from the catalog above to appear on your public profile.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-28 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, idx) => {
                    const tpl = getTemplate(service.name);
                    return (
                      <TableRow key={service.id}>
                        {/* Reorder */}
                        <TableCell className="p-1">
                          <div className="flex flex-col items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                              disabled={idx === 0 || reorderingId === service.id}
                              onClick={() => moveService(service.id, "up")}
                              title="Move up"
                            >
                              <ChevronUp className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 text-muted-foreground/50 hover:text-foreground disabled:opacity-20"
                              disabled={idx === services.length - 1 || reorderingId === service.id}
                              onClick={() => moveService(service.id, "down")}
                              title="Move down"
                            >
                              <ChevronDown className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>

                        {/* Name + thumbnail */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {tpl ? (
                              <ServiceThumbnail iconName={tpl.icon} color={tpl.color} size="sm" />
                            ) : (
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                                <Sparkles className="size-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 text-sm font-medium">
                                {service.name}
                                {service.is_featured && (
                                  <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">{service.category}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm">
                          {service.duration_minutes} min
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {formatCurrency(service.base_price)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={
                                service.is_active
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {service.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {availabilityLoaded && (
                              serviceAvailability[service.id] ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] gap-0.5">
                                  <CalendarCheck className="size-2.5" />
                                  Availability Set
                                </Badge>
                              ) : (
                                <Link href="/dashboard/availability" title="Set up availability for this service">
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] gap-0.5 cursor-pointer hover:bg-amber-500/20 transition-colors">
                                    <AlertTriangle className="size-2.5" />
                                    No Availability
                                  </Badge>
                                </Link>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {availabilityLoaded && !serviceAvailability[service.id] && (
                              <Link href="/dashboard/availability">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-amber-500 hover:text-amber-600"
                                  title="Set availability"
                                >
                                  <CalendarPlus className="size-4" />
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title={service.is_active ? "Deactivate" : "Activate"}
                              disabled={togglingId === service.id}
                              onClick={() => toggleActive(service)}
                            >
                              {togglingId === service.id
                                ? <Loader2 className="size-4 animate-spin" />
                                : service.is_active
                                ? <ToggleRight className="size-4 text-green-500" />
                                : <ToggleLeft className="size-4 text-muted-foreground" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-red-500"
                              title="Remove service"
                              disabled={removingId === service.id}
                              onClick={() => removeService(service)}
                            >
                              {removingId === service.id
                                ? <Loader2 className="size-4 animate-spin" />
                                : <Trash2 className="size-4" />}
                            </Button>
                          </div>
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
    </>
  );
}
