"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { formatDate } from "@/lib/format";

type FamilyMember = {
  id: string;
  full_name: string;
  date_of_birth: string;
  birth_time: string | null;
  birth_city: string | null;
  birth_country: string | null;
  relationship: string | null;
  age_group: "child" | "adult";
  natal_chart: Record<string, unknown> | null;
  chart_updated_at: string | null;
  notes: string | null;
};

const EMPTY_FORM = {
  fullName: "",
  dateOfBirth: "",
  birthTime: "",
  birthCity: "",
  birthCountry: "",
  relationship: "",
  notes: "",
};

const FAMILY_LIMIT = 5;

export default function CommunityFamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [planType, setPlanType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/community/family");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members ?? []);
      setPlanType(data.planType ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startAdd() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
    setError(null);
  }

  function startEdit(m: FamilyMember) {
    setForm({
      fullName: m.full_name,
      dateOfBirth: m.date_of_birth,
      birthTime: m.birth_time ?? "",
      birthCity: m.birth_city ?? "",
      birthCountry: m.birth_country ?? "",
      relationship: m.relationship ?? "",
      notes: m.notes ?? "",
    });
    setEditingId(m.id);
    setShowForm(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const method = editingId ? "PATCH" : "POST";
    const url = editingId
      ? `/api/community/family/${editingId}`
      : "/api/community/family";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Save failed");
    } else {
      setShowForm(false);
      setEditingId(null);
      await load();
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from your family?`)) return;
    setDeleting(id);
    await fetch(`/api/community/family/${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
  }

  const isFamily = planType === "family";
  const atLimit = members.length >= FAMILY_LIMIT;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">My Family</h1>
          </div>
          <p className="text-muted-foreground">
            Add family members to generate natal charts for everyone.
          </p>
        </div>
        {isFamily && !atLimit && !showForm && (
          <Button size="sm" asChild>
            <Link href="/community/family/new">
              <Plus className="mr-2 size-4" />
              Add Member
            </Link>
          </Button>
        )}
      </div>

      {/* Plan notice for individual members */}
      {planType === "individual" && (
        <Card className="border-amber-400/30 bg-amber-50/40">
          <CardContent className="flex items-start gap-3 py-4">
            <Info className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Individual Plan</p>
              <p className="text-sm text-amber-700">
                Upgrade to the Family Plan to add up to 5 family members and
                generate charts for everyone.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Edit Family Member" : "Add Family Member"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Relationship</Label>
                  <Input
                    value={form.relationship}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, relationship: e.target.value }))
                    }
                    placeholder="e.g. Spouse, Child, Parent"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Date of Birth *</Label>
                  <Input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Label>Time of Birth</Label>
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </div>
                  <Input
                    type="time"
                    value={form.birthTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, birthTime: e.target.value }))
                    }
                  />
                  {!form.birthTime && (
                    <p className="text-xs text-amber-600">
                      Add birth time for greater chart accuracy
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Birth City</Label>
                  <Input
                    value={form.birthCity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, birthCity: e.target.value }))
                    }
                    placeholder="City"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Birth Country</Label>
                  <Input
                    value={form.birthCountry}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, birthCountry: e.target.value }))
                    }
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Any additional notes (optional)"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Member"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Member list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">No family members yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isFamily
                  ? "Add up to 5 family members to generate natal charts for everyone."
                  : "Upgrade to the Family Plan to add family members."}
              </p>
            </div>
            {isFamily && (
              <Button size="sm" asChild>
                <Link href="/community/family/new">
                  <Plus className="mr-2 size-4" />
                  Add First Member
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{members.length}/{FAMILY_LIMIT} family members</span>
            {isFamily && !atLimit && !showForm && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/community/family/new">
                  <Plus className="mr-1.5 size-3.5" />
                  Add
                </Link>
              </Button>
            )}
          </div>
          {members.map((m) => {
            const isOpen = expandedId === m.id;
            const dob = new Date(m.date_of_birth + "T12:00:00");
            const ageYears = Math.floor(
              (new Date().getTime() - dob.getTime()) /
                (365.25 * 24 * 3600 * 1000)
            );
            return (
              <Card key={m.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpandedId(isOpen ? null : m.id)
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {m.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.relationship
                          ? `${m.relationship} · `
                          : ""}
                        Age {ageYears} ·{" "}
                        {dob.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={m.age_group === "child" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {m.age_group}
                    </Badge>
                    {m.natal_chart && (
                      <Badge variant="default" className="text-xs">
                        Chart ready
                      </Badge>
                    )}
                    {isOpen ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <CardContent className="border-t pt-4 space-y-3">
                    <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      {m.birth_time && (
                        <div>
                          <span className="text-muted-foreground">Birth time: </span>
                          {m.birth_time}
                        </div>
                      )}
                      {!m.birth_time && (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <Info className="size-3.5 shrink-0" />
                          <span className="text-xs">
                            Add birth time for greater chart accuracy
                          </span>
                        </div>
                      )}
                      {m.birth_city && (
                        <div>
                          <span className="text-muted-foreground">Born in: </span>
                          {m.birth_city}
                          {m.birth_country ? `, ${m.birth_country}` : ""}
                        </div>
                      )}
                      {m.chart_updated_at && (
                        <div>
                          <span className="text-muted-foreground">Chart generated: </span>
                          {formatDate(m.chart_updated_at)}
                        </div>
                      )}
                      {m.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Notes: </span>
                          {m.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Button size="sm" asChild>
                        <a href={`/community/family/${m.id}`}>
                          {m.natal_chart ? "View Chart" : "Generate Chart"}
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        disabled={deleting === m.id}
                        onClick={() => handleDelete(m.id, m.full_name)}
                      >
                        {deleting === m.id ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-1.5 size-3.5" />
                        )}
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
