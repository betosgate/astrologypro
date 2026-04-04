"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Telescope, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ENDPOINTS = [
  { value: "western_horoscope", label: "Western Horoscope" },
  { value: "planets/tropical", label: "Planets (Tropical)" },
  { value: "house_cusps/tropical", label: "House Cusps (Tropical)" },
  { value: "birth_details", label: "Birth Details" },
  { value: "astro_details", label: "Astro Details" },
];

type BirthData = {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number;
};

export default function HoroscopePage() {
  const [endpoint, setEndpoint] = useState("western_horoscope");
  const [form, setForm] = useState<Partial<BirthData>>({
    day: 1, month: 1, year: 1990, hour: 12, min: 0, lat: 40.7128, lon: -74.006, tzone: -5,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: keyof BirthData, val: string) {
    setForm((prev) => ({ ...prev, [field]: parseFloat(val) || 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/community/horoscope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, birth: form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Telescope className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Horoscope Calculator</h1>
        </div>
        <p className="text-muted-foreground">
          Calculate western horoscope data using birth date, time, and location.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Birth Data</CardTitle>
          <CardDescription>Enter the birth details to calculate the horoscope.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Chart Type</Label>
              <Select value={endpoint} onValueChange={setEndpoint}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map((ep) => (
                    <SelectItem key={ep.value} value={ep.value}>{ep.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["day", "month", "year"] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label className="capitalize">{field}</Label>
                  <Input
                    type="number"
                    value={form[field] ?? ""}
                    onChange={(e) => handleChange(field, e.target.value)}
                    min={field === "day" ? 1 : field === "month" ? 1 : 1900}
                    max={field === "day" ? 31 : field === "month" ? 12 : 2099}
                    required
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Hour (0–23)</Label>
                <Input
                  type="number"
                  value={form.hour ?? ""}
                  onChange={(e) => handleChange("hour", e.target.value)}
                  min={0} max={23} required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Minute</Label>
                <Input
                  type="number"
                  value={form.min ?? ""}
                  onChange={(e) => handleChange("min", e.target.value)}
                  min={0} max={59} required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.lat ?? ""}
                  onChange={(e) => handleChange("lat", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={form.lon ?? ""}
                  onChange={(e) => handleChange("lon", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5 max-w-[140px]">
              <Label>UTC Offset (tzone)</Label>
              <Input
                type="number"
                step="0.5"
                value={form.tzone ?? ""}
                onChange={(e) => handleChange("tzone", e.target.value)}
                placeholder="-5"
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Calculate
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted p-4 text-xs font-mono max-h-[500px] overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
