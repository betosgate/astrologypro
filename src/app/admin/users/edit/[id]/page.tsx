"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  userId: string;
  rowId: string;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  role: string;
  table: string;
  nameCol: string;
  videoProvider?: string;
  phoneProvider?: string;
}

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [videoProvider, setVideoProvider] = useState("daily");
  const [phoneProvider, setPhoneProvider] = useState("twilio");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/users/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setIsActive(data.isActive ?? true);
        if (data.videoProvider) setVideoProvider(data.videoProvider);
        if (data.phoneProvider) setPhoneProvider(data.phoneProvider);
      })
      .catch(() => {
        toast.error("Failed to load user profile");
        router.push("/admin/users");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          isActive,
          role: profile.role,
          rowId: profile.rowId,
          nameCol: profile.nameCol,
          ...(profile.role === "diviner" ? { videoProvider, phoneProvider } : {}),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to save");
      }
      toast.success("User profile updated");
      router.push("/admin/users");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const nameLabel =
    profile.role === "diviner" ? "Display Name" : "Full Name";

  const supportsActiveToggle = !["client", "community"].includes(profile.role);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit User</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <Badge variant="outline" className="ml-auto capitalize">
          {profile.role}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Email — read-only */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={profile.email} disabled className="bg-muted/40 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">
                {nameLabel}
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={nameLabel}
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Provider Preferences — diviners only */}
            {profile.role === "diviner" && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Provider Preferences</p>
                <div className="space-y-1.5">
                  <label htmlFor="videoProvider" className="text-xs font-medium text-muted-foreground">
                    Video Provider
                  </label>
                  <select
                    id="videoProvider"
                    value={videoProvider}
                    onChange={(e) => setVideoProvider(e.target.value)}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="daily">Daily.co (Default)</option>
                    <option value="chime">AWS Chime SDK</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="phoneProvider" className="text-xs font-medium text-muted-foreground">
                    Phone Provider
                  </label>
                  <select
                    id="phoneProvider"
                    value={phoneProvider}
                    onChange={(e) => setPhoneProvider(e.target.value)}
                    className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="twilio">Twilio (Default)</option>
                    <option value="chime">AWS Chime PSTN</option>
                  </select>
                </div>
              </div>
            )}

            {/* Active toggle — only for roles that support it */}
            {supportsActiveToggle && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active Status</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive users cannot book or participate.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
