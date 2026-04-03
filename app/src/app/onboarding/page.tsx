"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
  Upload,
  User,
  Calendar,
  Eye,
  Wand2,
} from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/constants";

const STEPS = [
  { label: "Profile", icon: User },
  { label: "Services", icon: Sparkles },
  { label: "Payments", icon: CreditCard },
  { label: "Availability", icon: Calendar },
  { label: "Preview", icon: Eye },
] as const;

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  default_price: number;
  duration_minutes: number;
}

interface SelectedService {
  template_id: string;
  price: number;
}

type WeeklySchedule = Record<number, number[]>;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [divinerId, setDivinerId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  // Step 1: Profile
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Bio generator
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [bioSpecialty, setBioSpecialty] = useState("astrology");
  const [bioYears, setBioYears] = useState("");
  const [bioApproach, setBioApproach] = useState("");
  const [generatedBios, setGeneratedBios] = useState<string[]>([]);
  const [generatedTaglines, setGeneratedTaglines] = useState<string[]>([]);
  const [bioGenerating, setBioGenerating] = useState(false);
  const [bioStep, setBioStep] = useState<"form" | "bios" | "taglines">("form");

  // Step 2: Services
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>(
    []
  );
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );

  // Step 3: Stripe Connect
  const [connectComplete, setConnectComplete] = useState(false);

  // Step 4: Availability
  const [schedule, setSchedule] = useState<WeeklySchedule>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });

  // Check auth and load initial data
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUsername(user.user_metadata?.username ?? "");

      // Load existing onboarding progress — query by user_id, not id
      const { data: diviner } = await supabase
        .from("diviners")
        .select("id, onboarding_step, display_name, bio, tagline, avatar_url, stripe_connect_id")
        .eq("user_id", user.id)
        .single();

      if (diviner) {
        setDivinerId(diviner.id);
        if (diviner.onboarding_step) {
          setCurrentStep(diviner.onboarding_step);
        }
        if (diviner.display_name) setDisplayName(diviner.display_name);
        if (diviner.bio) setBio(diviner.bio);
        if (diviner.tagline) setTagline(diviner.tagline);
        if (diviner.avatar_url) setAvatarPreview(diviner.avatar_url);
        if (diviner.stripe_connect_id) setConnectComplete(true);
      }

      const divId = diviner?.id;

      // Load service templates
      const { data: templates } = await supabase
        .from("service_templates")
        .select("*")
        .order("name");

      if (templates) {
        setServiceTemplates(templates);
      }

      // Load existing selected services — use diviner.id, not user.id
      if (divId) {
        const { data: existingServices } = await supabase
          .from("diviner_services")
          .select("template_id, price")
          .eq("diviner_id", divId);

        if (existingServices && existingServices.length > 0) {
          setSelectedServices(existingServices);
        }
      }

      // Load existing schedule — use diviner.id, not user.id
      if (divId) {
        const { data: existingSlots } = await supabase
          .from("availability_slots")
          .select("day_of_week, start_time")
          .eq("diviner_id", divId);

        if (existingSlots && existingSlots.length > 0) {
          const loaded: WeeklySchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
          for (const slot of existingSlots) {
            const hour = parseInt(slot.start_time.split(":")[0], 10);
            if (!loaded[slot.day_of_week].includes(hour)) {
              loaded[slot.day_of_week].push(hour);
            }
          }
          setSchedule(loaded);
        }
      }
    }

    init();
  }, [router, supabase]);

  // Check for connect_complete in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connect_complete") === "true") {
      setConnectComplete(true);
    }
    const stepParam = params.get("step");
    if (stepParam) {
      const parsed = parseInt(stepParam, 10);
      if (parsed >= 1 && parsed <= 5) {
        setCurrentStep(parsed);
      }
    }
  }, []);

  const saveStep = useCallback(
    async (step: number) => {
      if (!divinerId) return;
      await supabase
        .from("diviners")
        .update({ onboarding_step: step })
        .eq("id", divinerId);
    },
    [divinerId, supabase]
  );

  async function handleGenerateBio() {
    if (!bioYears || !bioApproach) return;
    setBioGenerating(true);

    try {
      const response = await fetch("/api/generate-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialties: bioSpecialty,
          yearsExperience: bioYears,
          approach: bioApproach,
          name: displayName || "Your Name",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Failed to generate bio");
        return;
      }

      setGeneratedBios(result.bios);
      setGeneratedTaglines(result.taglines);
      setBioStep("bios");
    } catch {
      setError("Failed to generate bio. Please try again.");
    } finally {
      setBioGenerating(false);
    }
  }

  function selectBio(bio: string) {
    setBio(bio);
    setBioStep("taglines");
  }

  function selectTagline(t: string) {
    setTagline(t);
    setBioDialogOpen(false);
    setBioStep("form");
  }

  async function handleProfileSave() {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      let avatarUrl = avatarPreview;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `avatars/${userId}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          setError("Failed to upload avatar: " + uploadError.message);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from("diviners")
        .update({
          display_name: displayName,
          bio,
          tagline,
          avatar_url: avatarUrl,
        })
        .eq("id", divinerId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      await saveStep(2);
      setCurrentStep(2);
    } catch {
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleServicesSave() {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      // Delete existing services and insert new ones
      await supabase
        .from("diviner_services")
        .delete()
        .eq("diviner_id", divinerId);

      if (selectedServices.length > 0) {
        const { error: insertError } = await supabase
          .from("diviner_services")
          .insert(
            selectedServices.map((s) => ({
              diviner_id: divinerId,
              template_id: s.template_id,
              price: s.price,
            }))
          );

        if (insertError) {
          setError(insertError.message);
          return;
        }
      }

      await saveStep(3);
      setCurrentStep(3);
    } catch {
      setError("Failed to save services. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeConnect() {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const { data: divinerData } = await supabase
        .from("diviners")
        .select("email")
        .eq("id", divinerId)
        .single();

      const response = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: divinerData?.email,
          divinerId: divinerId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        setError(result.error ?? "Failed to start Stripe Connect onboarding.");
        return;
      }

      // Save the connect account ID
      await supabase
        .from("diviners")
        .update({ stripe_connect_id: result.accountId })
        .eq("id", divinerId);

      window.location.href = result.url;
    } catch {
      setError("Failed to connect Stripe. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAvailabilitySave() {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      // Delete existing slots and insert new ones
      await supabase
        .from("availability_slots")
        .delete()
        .eq("diviner_id", divinerId);

      const slots: {
        diviner_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
      }[] = [];

      for (const [dayStr, hours] of Object.entries(schedule)) {
        const day = parseInt(dayStr, 10);
        for (const hour of hours) {
          slots.push({
            diviner_id: divinerId!,
            day_of_week: day,
            start_time: `${hour.toString().padStart(2, "0")}:00`,
            end_time: `${(hour + 1).toString().padStart(2, "0")}:00`,
          });
        }
      }

      if (slots.length > 0) {
        const { error: insertError } = await supabase
          .from("availability_slots")
          .insert(slots);

        if (insertError) {
          setError(insertError.message);
          return;
        }
      }

      await saveStep(5);
      setCurrentStep(5);
    } catch {
      setError("Failed to save availability. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleHour(day: number, hour: number) {
    setSchedule((prev) => {
      const dayHours = prev[day] ?? [];
      const exists = dayHours.includes(hour);
      return {
        ...prev,
        [day]: exists
          ? dayHours.filter((h) => h !== hour)
          : [...dayHours, hour].sort((a, b) => a - b),
      };
    });
  }

  function toggleService(templateId: string, defaultPrice: number) {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.template_id === templateId);
      if (exists) {
        return prev.filter((s) => s.template_id !== templateId);
      }
      return [...prev, { template_id: templateId, price: defaultPrice }];
    });
  }

  function updateServicePrice(templateId: string, price: number) {
    setSelectedServices((prev) =>
      prev.map((s) =>
        s.template_id === templateId ? { ...s, price } : s
      )
    );
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function formatHour(hour: number): string {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  }

  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">AstrologyPro Setup</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step labels */}
          <div className="mt-3 flex justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isComplete = stepNum < currentStep;

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-1.5 text-xs transition-colors ${
                    isActive
                      ? "font-medium text-primary"
                      : isComplete
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <StepIcon className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex flex-1 justify-center px-4 py-8">
        <div className="w-full max-w-3xl">
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Step 1: Profile */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Tell clients about yourself and upload a photo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-24 w-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                        <Upload className="h-4 w-4" />
                        Upload Photo
                      </div>
                    </Label>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG, or WebP. Max 2MB.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    placeholder="e.g. Mystic Maya"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="e.g. Illuminating your path through the stars"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about your experience, specialties, and approach..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                  />
                </div>

                {/* Bio Generator */}
                <Dialog
                  open={bioDialogOpen}
                  onOpenChange={(open) => {
                    setBioDialogOpen(open);
                    if (!open) setBioStep("form");
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Wand2 className="h-4 w-4" />
                      Need help? Generate a bio &amp; tagline
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    {bioStep === "form" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Generate Your Bio</DialogTitle>
                          <DialogDescription>
                            Answer a few quick questions and we will create professional bio and tagline options for you.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label>What do you specialize in?</Label>
                            <Select value={bioSpecialty} onValueChange={setBioSpecialty}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="astrology">Astrology</SelectItem>
                                <SelectItem value="tarot">Tarot Reading</SelectItem>
                                <SelectItem value="both">Both Astrology &amp; Tarot</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>How many years of experience?</Label>
                            <Select value={bioYears} onValueChange={setBioYears}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select experience" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-3">1 - 3 years</SelectItem>
                                <SelectItem value="3-5">3 - 5 years</SelectItem>
                                <SelectItem value="5-10">5 - 10 years</SelectItem>
                                <SelectItem value="10+">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>How would you describe your approach?</Label>
                            <Select value={bioApproach} onValueChange={setBioApproach}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select approach" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warm">Warm &amp; Intuitive</SelectItem>
                                <SelectItem value="professional">Professional &amp; Analytical</SelectItem>
                                <SelectItem value="spiritual">Spiritual &amp; Sacred</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleGenerateBio}
                            disabled={bioGenerating || !bioYears || !bioApproach}
                            className="w-full"
                          >
                            {bioGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate Options
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}

                    {bioStep === "bios" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Choose Your Bio</DialogTitle>
                          <DialogDescription>
                            Pick the bio that best represents you. You can edit it after selecting.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          {generatedBios.map((b, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectBio(b)}
                              className="w-full rounded-lg border border-border p-3 text-left text-sm leading-relaxed text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                            >
                              <span className="mb-1 block text-xs font-semibold text-primary">
                                Option {i + 1}
                              </span>
                              {b}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {bioStep === "taglines" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Choose Your Tagline</DialogTitle>
                          <DialogDescription>
                            Pick a tagline that appears below your name. You can edit it after selecting.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 pt-2">
                          {generatedTaglines.map((t, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectTagline(t)}
                              className="w-full rounded-lg border border-border p-3 text-left text-sm font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                            >
                              {t}
                            </button>
                          ))}
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => {
                              setBioDialogOpen(false);
                              setBioStep("form");
                            }}
                          >
                            Skip tagline
                          </Button>
                        </div>
                      </>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Services */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Services</CardTitle>
                <CardDescription>
                  Select the services you offer and set your prices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {serviceTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Loading service templates...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {serviceTemplates.map((template) => {
                      const isSelected = selectedServices.some(
                        (s) => s.template_id === template.id
                      );
                      const selectedService = selectedServices.find(
                        (s) => s.template_id === template.id
                      );

                      return (
                        <div
                          key={template.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            isSelected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`service-${template.id}`}
                              checked={isSelected}
                              onCheckedChange={() =>
                                toggleService(
                                  template.id,
                                  template.default_price
                                )
                              }
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={`service-${template.id}`}
                                className="cursor-pointer text-sm font-medium"
                              >
                                {template.name}
                              </label>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {template.description} &middot;{" "}
                                {template.duration_minutes} min
                              </p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={selectedService?.price ?? 0}
                                  onChange={(e) =>
                                    updateServicePrice(
                                      template.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-8 w-24"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button onClick={handleServicesSave} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Stripe Connect */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Get Paid</CardTitle>
                <CardDescription>
                  Connect your Stripe account to accept payments from clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    {connectComplete
                      ? "Stripe Connected"
                      : "Connect with Stripe"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {connectComplete
                      ? "Your Stripe account is connected. You can receive payments from clients."
                      : "Stripe handles all payments securely. You will be redirected to Stripe to complete setup."}
                  </p>

                  {!connectComplete && (
                    <Button
                      onClick={handleStripeConnect}
                      disabled={loading}
                      className="mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect Stripe
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}

                  {connectComplete && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      <Check className="h-4 w-4" />
                      Connected
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={async () => {
                      await saveStep(4);
                      setCurrentStep(4);
                    }}
                    disabled={!connectComplete}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Availability */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Set Your Availability</CardTitle>
                <CardDescription>
                  Click the time blocks when you are available for sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* Header row with day names */}
                    <div className="mb-2 grid grid-cols-[60px_repeat(7,1fr)] gap-1">
                      <div />
                      {DAYS_OF_WEEK.map((day, i) => (
                        <div
                          key={day}
                          className="text-center text-xs font-medium text-muted-foreground"
                        >
                          {day.slice(0, 3)}
                        </div>
                      ))}
                    </div>

                    {/* Time grid */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="grid grid-cols-[60px_repeat(7,1fr)] gap-1"
                      >
                        <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">
                          {formatHour(hour)}
                        </div>
                        {DAYS_OF_WEEK.map((_, dayIndex) => {
                          const isActive =
                            schedule[dayIndex]?.includes(hour) ?? false;
                          return (
                            <button
                              key={`${dayIndex}-${hour}`}
                              type="button"
                              onClick={() => toggleHour(dayIndex, hour)}
                              className={`h-8 rounded-sm border transition-colors ${
                                isActive
                                  ? "border-primary bg-primary/20 hover:bg-primary/30"
                                  : "border-border bg-background hover:bg-muted"
                              }`}
                              aria-label={`${DAYS_OF_WEEK[dayIndex]} ${formatHour(hour)}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-sm border border-primary bg-primary/20" />
                    Available
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-sm border border-border bg-background" />
                    Unavailable
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleAvailabilitySave}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Preview */}
          {currentStep === 5 && (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">
                  Your page is live!
                </CardTitle>
                <CardDescription>
                  Clients can now find and book you at the link below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Your public page
                  </p>
                  <a
                    href={`/${username}`}
                    className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-primary hover:underline"
                  >
                    astrologypro.com/{username}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                {displayName && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-4">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={displayName}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{displayName}</h3>
                        {tagline && (
                          <p className="text-sm text-muted-foreground">
                            {tagline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="mb-2 text-sm font-medium">
                      Services ({selectedServices.length})
                    </h4>
                    <div className="space-y-1">
                      {selectedServices.map((s) => {
                        const template = serviceTemplates.find(
                          (t) => t.id === s.template_id
                        );
                        return (
                          <div
                            key={s.template_id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {template?.name ?? "Service"}
                            </span>
                            <span className="font-medium">${s.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    onClick={async () => {
                      // Fire-and-forget: mark onboarding complete + send welcome email
                      try {
                        await fetch("/api/onboarding/complete", { method: "POST" });
                      } catch {
                        // Non-blocking — proceed to dashboard even if this fails
                      }
                      router.push("/dashboard");
                    }}
                    size="lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
