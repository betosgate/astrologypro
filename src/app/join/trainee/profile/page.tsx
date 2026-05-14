"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import {
  getAllowedSpecialtiesForPackage,
  resolveRoleServicePackage,
  type RoleServicePackageRow,
} from "@/lib/role-service-packages.shared";

const SPECIALTIES = [
  "Astrology",
  "Tarot",
  "Numerology",
  "Human Design",
  "Oracle Cards",
  "Palmistry",
  "Runes",
  "Crystal Healing",
] as const;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Berlin", label: "Central European Time (CET)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
] as const;

const STEP_ICONS = [User, Sparkles, Star] as const;
const STEP_LABELS = ["About You", "Specialties & Interests", "Birth Data"] as const;
const TIMEZONE_VALUES = new Set(TIMEZONES.map((timezone) => timezone.value));

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const compact = trimmed.replace(/[\s().-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return digits;

  return undefined;
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidBirthDate(value: string) {
  if (!value) return true;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date();
}

type FieldErrors = Partial<
  Record<
    | "displayName"
    | "bio"
    | "avatarUrl"
    | "phone"
    | "timezone"
    | "specialties"
    | "goals"
    | "birthDate"
    | "birthTime"
    | "birthCity",
    string
  >
>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

function TraineeProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvited = searchParams.get("invited") === "true";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");

  // Step 2
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [allowedSpecialties, setAllowedSpecialties] =
    useState<string[]>([...SPECIALTIES]);
  const [packageLabel, setPackageLabel] = useState<string>("Astrology + Tarot");
  const [goals, setGoals] = useState("");

  // Step 3
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");

  // Pre-fill name from trainee record
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      supabase
        .from("trainees")
        .select("name, service_package_code, paid_at")
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: trainee }) => {
          if (
            data.user?.user_metadata?.invited_by_admin === true &&
            trainee &&
            !trainee.paid_at
          ) {
            router.replace("/join/trainee/plan?invited=true");
            return;
          }
          if (trainee?.name) setDisplayName(trainee.name);
          const pkgCode =
            typeof trainee?.service_package_code === "string"
              ? trainee.service_package_code
              : "both";
          const resolvedPackage = resolveRoleServicePackage(
            [
              {
                package_code: "both",
                display_name: "Astrology + Tarot",
                description: null,
                allows_astrology: true,
                allows_tarot: true,
                applies_to_roles: ["diviner", "trainee"],
                default_for_roles: ["diviner", "trainee"],
                is_active: true,
                sort_order: 10,
              },
              {
                package_code: "astrology_only",
                display_name: "Astrology Only",
                description: null,
                allows_astrology: true,
                allows_tarot: false,
                applies_to_roles: ["diviner", "trainee"],
                default_for_roles: [],
                is_active: true,
                sort_order: 20,
              },
              {
                package_code: "tarot_only",
                display_name: "Tarot Only",
                description: null,
                allows_astrology: false,
                allows_tarot: true,
                applies_to_roles: ["diviner", "trainee"],
                default_for_roles: [],
                is_active: true,
                sort_order: 30,
              },
            ] as RoleServicePackageRow[],
            pkgCode,
          );
          setPackageLabel(resolvedPackage.displayName);
          setAllowedSpecialties(
            getAllowedSpecialtiesForPackage(SPECIALTIES, resolvedPackage),
          );
          setInitialLoading(false);
        });
    });
  }, [router]);

  function toggleSpecialty(s: string) {
    setErrors((prev) => ({ ...prev, specialties: undefined }));
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function validateStep(currentStep: number): FieldErrors {
    const nextErrors: FieldErrors = {};

    if (currentStep === 1) {
      if (!displayName.trim()) {
        nextErrors.displayName = "Display name is required.";
      } else if (displayName.trim().length < 2) {
        nextErrors.displayName = "Display name must be at least 2 characters.";
      }

      if (bio.trim().length > 500) {
        nextErrors.bio = "Bio must be 500 characters or fewer.";
      }

      if (!isValidUrl(avatarUrl)) {
        nextErrors.avatarUrl = "Avatar URL must be a valid http or https URL.";
      }

      const normalizedPhone = normalizePhone(phone);
      if (!normalizedPhone) {
        nextErrors.phone = "Phone number is required.";
      } else if (normalizedPhone === undefined) {
        nextErrors.phone = "Enter a valid E.164 number or a 10-digit phone number.";
      }

      if (!timezone) {
        nextErrors.timezone = "Timezone is required.";
      } else if (!TIMEZONE_VALUES.has(timezone)) {
        nextErrors.timezone = "Select a supported timezone.";
      }
    }

    if (currentStep === 2) {
      if (specialties.length === 0) {
        nextErrors.specialties = "Select at least one specialty or area of interest.";
      }
      if (goals.trim().length > 1000) {
        nextErrors.goals = "Goals must be 1000 characters or fewer.";
      }
    }

    if (currentStep === 3) {
      if (!isValidBirthDate(birthDate)) {
        nextErrors.birthDate = "Birth date must be a valid past date.";
      }
      if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) {
        nextErrors.birthTime = "Birth time must use HH:MM format.";
      }
      if (birthCity.trim().length > 120) {
        nextErrors.birthCity = "Birth city must be 120 characters or fewer.";
      }
    }

    return nextErrors;
  }

  function validateAndSetStep(currentStep: number) {
    const nextErrors = validateStep(currentStep);
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    const allErrors = {
      ...validateStep(1),
      ...validateStep(2),
      ...validateStep(3),
    };
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      const firstErrorStep =
        allErrors.displayName ||
        allErrors.bio ||
        allErrors.avatarUrl ||
        allErrors.phone ||
        allErrors.timezone
          ? 1
          : allErrors.specialties || allErrors.goals
            ? 2
            : 3;
      setStep(firstErrorStep);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/trainee/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          phone: normalizePhone(phone),
          timezone: timezone || null,
          specialties,
          goals: goals.trim() || null,
          birth_date: birthDate || null,
          birth_time: birthTime || null,
          birth_city: birthCity.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to save profile. Please try again.");
        return;
      }

      const nextParam = searchParams.get("next");
      toast.success("Profile complete! Welcome to your training journey.");
      router.push(nextParam || "/trainee");


    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MarketingHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </main>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Progress indicator */}
          <div className="mb-8">
            <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
              Complete Your Profile
            </h1>
            {isInvited ? (
              <p className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-center text-sm text-muted-foreground">
                Your account was invited by admin. Complete the standard trainee setup before trainee portal access is unlocked.
              </p>
            ) : null}
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Step {step} of 3 &mdash; {STEP_LABELS[step - 1]}
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => {
                const Icon = STEP_ICONS[s - 1];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (s < step) setStep(s);
                    }}
                    className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                      s === step
                        ? "border-primary bg-primary text-primary-foreground"
                        : s < step
                          ? "border-primary/50 bg-primary/10 text-primary cursor-pointer"
                          : "border-muted bg-muted/30 text-muted-foreground"
                    }`}
                    aria-label={`Step ${s}: ${STEP_LABELS[s - 1]}`}
                    aria-current={s === step ? "step" : undefined}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{STEP_LABELS[step - 1]}</CardTitle>
              <CardDescription>
                {step === 1 && "Tell us a bit about yourself."}
                {step === 2 && "Select your areas of interest and share your goals."}
                {step === 3 && "Optional birth data for chart calculations."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ─── Step 1: About You ─── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      placeholder="Your display name"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setErrors((prev) => ({ ...prev, displayName: undefined }));
                      }}
                      aria-invalid={!!errors.displayName}
                      required
                    />
                    <FieldError message={errors.displayName} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      Bio{" "}
                      <span className="text-muted-foreground">
                        ({bio.length}/500)
                      </span>
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="A short introduction about yourself..."
                      value={bio}
                      maxLength={500}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setErrors((prev) => ({ ...prev, bio: undefined }));
                      }}
                      aria-invalid={!!errors.bio}
                      rows={3}
                    />
                    <FieldError message={errors.bio} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">
                      Avatar URL{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatarUrl}
                      onChange={(e) => {
                        setAvatarUrl(e.target.value);
                        setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
                      }}
                      aria-invalid={!!errors.avatarUrl}
                    />
                    <FieldError message={errors.avatarUrl} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      aria-invalid={!!errors.phone}
                      required
                    />
                    <FieldError message={errors.phone} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Select
                      value={timezone}
                      onValueChange={(value) => {
                        setTimezone(value);
                        setErrors((prev) => ({ ...prev, timezone: undefined }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.timezone} />
                  </div>
                </div>
              )}

              {/* ─── Step 2: Specialties & Interests ─── */}
              {step === 2 && (
                <div className="space-y-6">

                  <div className="space-y-3">
                    <Label>Specialties / Areas of Interest *</Label>
                    <div className="flex flex-wrap gap-2">
                      {allowedSpecialties.map((s) => {
                        const selected = specialties.includes(s);
                        return (
                          <label key={s} className="cursor-pointer">
                            <Badge
                              variant={selected ? "default" : "outline"}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                selected
                                  ? "bg-primary hover:bg-primary/90"
                                  : "hover:bg-accent"
                              }`}
                            >
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleSpecialty(s)}
                                className="sr-only"
                                aria-label={s}
                              />
                              {s}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                    <FieldError message={errors.specialties} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goals">
                      What do you hope to achieve from the training?
                    </Label>
                    <Textarea
                      id="goals"
                      placeholder="Share your aspirations and what you'd like to learn..."
                      value={goals}
                      onChange={(e) => {
                        setGoals(e.target.value);
                        setErrors((prev) => ({ ...prev, goals: undefined }));
                      }}
                      aria-invalid={!!errors.goals}
                      rows={4}
                    />
                    <FieldError message={errors.goals} />
                  </div>
                </div>
              )}

              {/* ─── Step 3: Birth Data ─── */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Birth data is used for chart calculations during your
                    training. All fields are optional.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={birthDate}
                      onChange={(e) => {
                        setBirthDate(e.target.value);
                        setErrors((prev) => ({ ...prev, birthDate: undefined }));
                      }}
                      aria-invalid={!!errors.birthDate}
                    />
                    <FieldError message={errors.birthDate} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthTime">
                      Birth Time{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="birthTime"
                      type="time"
                      value={birthTime}
                      onChange={(e) => {
                        setBirthTime(e.target.value);
                        setErrors((prev) => ({ ...prev, birthTime: undefined }));
                      }}
                      aria-invalid={!!errors.birthTime}
                    />
                    <FieldError message={errors.birthTime} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birthCity">
                      Birth City{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="birthCity"
                      placeholder="e.g. New York, NY"
                      value={birthCity}
                      onChange={(e) => {
                        setBirthCity(e.target.value);
                        setErrors((prev) => ({ ...prev, birthCity: undefined }));
                      }}
                      aria-invalid={!!errors.birthCity}
                    />
                    <FieldError message={errors.birthCity} />
                  </div>
                </div>
              )}

              {/* ─── Navigation Buttons ─── */}
              <div className="mt-6 flex items-center justify-between">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateAndSetStep(step)) setStep(step + 1);
                    }}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Complete Profile & Start Training"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

export default function TraineeProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#070b14]">
          <MarketingHeader />
          <main className="flex flex-1 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </main>
          <MarketingFooter />
        </div>
      }
    >
      <TraineeProfileContent />
    </Suspense>
  );
}
