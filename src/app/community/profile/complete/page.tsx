"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";

const RELATIONSHIP_STATUSES = [
  "Single",
  "In a relationship",
  "Engaged",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
  "It's complicated",
];

const QUESTIONNAIRE_FIELDS = [
  ["personality", "Personality"],
  ["strengths", "Strengths"],
  ["lifeAreasFulfilling", "Life areas — most fulfilling"],
  ["lifeAreasImprovement", "Life areas needing improvement"],
  ["longTermGoals", "Long-term goals"],
  ["majorLifeEvents", "Major life events"],
  ["stressManagement", "How you manage stress"],
  ["workLifeBalance", "Work / life balance"],
  ["relationship_with_family", "Relationship with family"],
  ["biggest_current_challenges", "Biggest current challenges"],
  ["focus_on_specific_relationships", "Focus on specific relationships"],
  ["guidance_on_specific_decision", "Guidance on a specific decision"],
  ["concerns_about_romantic_life", "Concerns about romantic life"],
  ["ongoing_projects_or_plans", "Ongoing projects or plans"],
  ["social_life_fulfillment", "Social life fulfillment"],
  ["spiritualPractices", "Current spiritual practices"],
  ["selfDiscovery", "Self-discovery focus"],
  ["externalInfluences", "External influences"],
  ["achieveFromReading", "What you hope to achieve from a reading"],
  ["specificQuestions", "Specific questions"],
  ["goalsOutcomes", "Desired outcomes"],
  ["practicalSpiritualPref", "Practical / spiritual preference"],
  ["mainConcern", "Main concern"],
  ["additionalInfo", "Anything else you'd like to share"],
] as const;

export default function ProfileCompletionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coreData, setCoreData] = useState<any>({});
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/community/profile/complete");
        if (!res.ok) {
          throw new Error("Failed to load profile data");
        }
        const data = await res.json();
        setCoreData({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          state: data.state,
          birth_location_label: data.intake_data?.birth_location_label,
          date_of_birth: data.intake_data?.date_of_birth,
          birth_time: data.intake_data?.birth_time,
        });

        // Pre-fill existing questionnaire data if any
        setFormData(data.intake_data || {});
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handlePatch = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Basic required check for core gating fields
    if (!formData.relationship_status || !formData.mainConcern) {
      setError("Please fill out at least 'Relationship status' and 'Main concern' to continue.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/community/profile/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save profile");
      }

      router.push("/community");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container max-w-3xl py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Complete your profile</h1>
        <p className="text-muted-foreground mt-2">
          Almost there! We just need a little more background information to fully prepare your Natal Charts and readings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-green-600" />
              Pre-filled Identity Information
            </CardTitle>
            <CardDescription>We've safely stored this from your initial signup.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input disabled value={coreData.full_name || ""} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input disabled value={coreData.email || ""} />
            </div>
            <div className="space-y-1">
              <Label>Date of Birth</Label>
              <Input disabled value={coreData.date_of_birth || ""} />
            </div>
            <div className="space-y-1">
              <Label>Time of Birth</Label>
              <Input disabled value={coreData.birth_time || ""} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Birth Location</Label>
              <Input disabled value={coreData.birth_location_label || ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guidance Questionnaire</CardTitle>
            <CardDescription>
              This context ensures that your readings are perfectly tailored to your current life situation. 
              <span className="font-medium text-foreground ml-1">Relationship status and Main concern are required.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col">
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="req_relationship_status">Relationship status <span className="text-red-500">*</span></Label>
              <Select
                value={formData.relationship_status || ""}
                onValueChange={(v) => handlePatch("relationship_status", v)}
              >
                <SelectTrigger id="req_relationship_status">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_STATUSES.map((rs) => (
                    <SelectItem key={rs} value={rs}>
                      {rs}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {QUESTIONNAIRE_FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>
                  {label} {key === "mainConcern" && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id={key}
                  rows={3}
                  value={formData[key] || ""}
                  onChange={(e) => handlePatch(key, e.target.value)}
                  placeholder={`Tell us about your ${label.toLowerCase()}...`}
                />
              </div>
            ))}

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20 font-medium">
                {error}
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" disabled={saving}>
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save and go to Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
