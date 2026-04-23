"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, GraduationCap, Plus, Trash2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CertificateConfig {
  id: string;
  school_name: string;
  school_tagline: string;
  designation_title: string;
  program_title: string;
  head_master_name: string;
  study_hours: string;
  live_classroom_hours: string;
  live_readings: string;
  certification_count: string;
  astrology_programs: string[];
  tarot_programs: string[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CertificateConfigPage() {
  const [config, setConfig] = useState<CertificateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/certificate-config");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      toast.error("Failed to load certificate config");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/certificate-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.title ?? "Save failed");
      }
      toast.success("Certificate config saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addProgram = (field: "astrology_programs" | "tarot_programs") => {
    if (!config) return;
    setConfig({ ...config, [field]: [...config[field], ""] });
  };

  const removeProgram = (field: "astrology_programs" | "tarot_programs", idx: number) => {
    if (!config) return;
    const updated = config[field].filter((_, i) => i !== idx);
    setConfig({ ...config, [field]: updated });
  };

  const updateProgram = (
    field: "astrology_programs" | "tarot_programs",
    idx: number,
    value: string
  ) => {
    if (!config) return;
    const updated = config[field].map((p, i) => (i === idx ? value : p));
    setConfig({ ...config, [field]: updated });
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) return null;

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="size-6" />
            Certificate Config
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the trainee graduation certificate — school name, programs, designation, and head master.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {/* ── School Identity ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Identity</CardTitle>
          <CardDescription>Appears in the certificate header and footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="school_name">School Name</Label>
            <Input
              id="school_name"
              value={config.school_name}
              onChange={(e) => setConfig({ ...config, school_name: e.target.value })}
              placeholder="School of Our Divine Infinite Being"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school_tagline">Tagline / Subtitle</Label>
            <Input
              id="school_tagline"
              value={config.school_tagline}
              onChange={(e) => setConfig({ ...config, school_tagline: e.target.value })}
              placeholder="Polytheistic Monism · Divine Theurgy · Oracle to the Gods"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Certification ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certification Details</CardTitle>
          <CardDescription>The program name and designation awarded on graduation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="program_title">Program Title</Label>
            <Input
              id="program_title"
              value={config.program_title}
              onChange={(e) => setConfig({ ...config, program_title: e.target.value })}
              placeholder="Astrology & Tarot Consulting Certification Course"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="designation_title">Designation Title</Label>
            <Input
              id="designation_title"
              value={config.designation_title}
              onChange={(e) => setConfig({ ...config, designation_title: e.target.value })}
              placeholder="Certified Divination Consultant"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="head_master_name">Head Master Name</Label>
            <Input
              id="head_master_name"
              value={config.head_master_name}
              onChange={(e) => setConfig({ ...config, head_master_name: e.target.value })}
              placeholder="Eddie Paredes"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Training Stats ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Stats Block</CardTitle>
          <CardDescription>Displayed as stat cards on the certificate (e.g. &ldquo;100+ Hours of Study&rdquo;)</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="study_hours">Hours of Study</Label>
            <Input
              id="study_hours"
              value={config.study_hours}
              onChange={(e) => setConfig({ ...config, study_hours: e.target.value })}
              placeholder="100+"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="live_classroom_hours">Live Classroom Hours</Label>
            <Input
              id="live_classroom_hours"
              value={config.live_classroom_hours}
              onChange={(e) => setConfig({ ...config, live_classroom_hours: e.target.value })}
              placeholder="30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="live_readings">Live Readings Performed</Label>
            <Input
              id="live_readings"
              value={config.live_readings}
              onChange={(e) => setConfig({ ...config, live_readings: e.target.value })}
              placeholder="20+"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="certification_count">Certification Programs</Label>
            <Input
              id="certification_count"
              value={config.certification_count}
              onChange={(e) => setConfig({ ...config, certification_count: e.target.value })}
              placeholder="15"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Astrology Programs ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Astrology Programs</CardTitle>
              <CardDescription>Listed on the left column of the certificate programs section</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addProgram("astrology_programs")}
            >
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.astrology_programs.map((prog, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={prog}
                onChange={(e) => updateProgram("astrology_programs", idx, e.target.value)}
                placeholder={`Astrology program ${idx + 1}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeProgram("astrology_programs", idx)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {config.astrology_programs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No astrology programs. Add one above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Tarot Programs ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tarot Programs</CardTitle>
              <CardDescription>Listed on the right column of the certificate programs section</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addProgram("tarot_programs")}
            >
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {config.tarot_programs.map((prog, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={prog}
                onChange={(e) => updateProgram("tarot_programs", idx, e.target.value)}
                placeholder={`Tarot program ${idx + 1}`}
              />
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeProgram("tarot_programs", idx)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {config.tarot_programs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tarot programs. Add one above.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sticky save at bottom for convenience */}
      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} size="lg">
          {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
