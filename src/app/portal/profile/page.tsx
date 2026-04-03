"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 30]) {
      const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? "AM" : "PM";
      const label = `${h12}:${minute.toString().padStart(2, "0")} ${ampm}`;
      const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export default function PortalProfilePage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (client) {
        setDisplayName(client.full_name ?? "");
        setEmail(client.email ?? user.email ?? "");
        setPhone(client.phone ?? "");
        setBirthDate(client.birth_date ?? "");
        setBirthTime(client.birth_time ?? "");
        setBirthCity(client.birth_city ?? "");
      } else {
        setEmail(user.email ?? "");
      }
      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }

      const { error: updateError } = await supabase
        .from("clients")
        .update({
          full_name: displayName,
          phone: phone || null,
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          birth_city: birthCity || null,
        })
        .eq("user_id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information and birth data.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile details. Your birth data is securely stored and
              shared with your diviner before sessions to prepare your reading.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display-name">Full Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-semibold">Birth Data</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="birth-date">Birth Date</Label>
                  <Input
                    id="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth-time">Birth Time</Label>
                  <Select value={birthTime} onValueChange={setBirthTime}>
                    <SelectTrigger id="birth-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth-city">Birth City</Label>
                  <Input
                    id="birth-city"
                    value={birthCity}
                    onChange={(e) => setBirthCity(e.target.value)}
                    placeholder="e.g. New York, NY"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="text-sm text-green-500">
                Profile updated successfully.
              </p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
