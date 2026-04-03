"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySearch, type CityResult } from "./city-search";
import {
  UNIVERSAL_QUESTIONS,
  RELATIONSHIP_QUESTIONS,
  isRelationshipService,
  getServiceQuestions,
  type IntakeQuestion,
} from "@/lib/intake-questions";
import { ChevronDown, ChevronUp, Users, Sparkles, Heart } from "lucide-react";

// ---------------------------------------------------------------------------
// Data shape
// ---------------------------------------------------------------------------

export interface IntakeData {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLat?: number;
  birthLng?: number;
  birthTimezone?: string;
  birthTimeAccuracy?: string;
  focusQuestion: string;
  lifeArea: string;
  // Second person fields (relationship readings)
  secondPersonName: string;
  secondPersonAttending: string;
  secondPersonEmail: string;
  secondPersonBirthDate: string;
  secondPersonBirthTime: string;
  secondPersonBirthCity: string;
  secondPersonBirthLat?: number;
  secondPersonBirthLng?: number;
  secondPersonBirthTimezone?: string;
  // Dynamic extra fields stored as key-value
  extras: Record<string, string>;
}

interface IntakeFormProps {
  requiresBirthData: boolean;
  serviceSlug: string;
  serviceCategory: string;
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIFE_AREAS = [
  "General",
  "Career",
  "Love & Relationships",
  "Health & Wellness",
  "Spiritual Growth",
  "Finances",
  "Family",
];

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${hour12}:${String(m).padStart(2, "0")} ${period}`;
      options.push({ value: hour24, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------

function Section({
  title,
  icon,
  defaultOpen = true,
  accent,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  accent?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-lg border ${accent ?? "border-white/10"} overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic question renderer
// ---------------------------------------------------------------------------

function DynamicQuestion({
  q,
  value,
  onChangeValue,
  onCityChange,
}: {
  q: IntakeQuestion;
  value: string;
  onChangeValue: (key: string, val: string) => void;
  onCityChange?: (key: string, result: CityResult) => void;
}) {
  switch (q.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={q.key}>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <Input
            id={q.key}
            placeholder={q.placeholder}
            value={value}
            onChange={(e) => onChangeValue(q.key, e.target.value)}
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2">
          <Label htmlFor={q.key}>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <Textarea
            id={q.key}
            placeholder={q.placeholder}
            value={value}
            onChange={(e) => onChangeValue(q.key, e.target.value)}
            rows={3}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={q.key}>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <Select
            value={value}
            onValueChange={(val) => onChangeValue(q.key, val)}
          >
            <SelectTrigger id={q.key} className="w-full">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {q.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "multiselect":
      return (
        <div className="space-y-2">
          <Label>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options?.map((opt) => {
              const selected = value
                .split("|||")
                .filter(Boolean)
                .includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/5"
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => {
                      const current = value
                        .split("|||")
                        .filter(Boolean);
                      const next = selected
                        ? current.filter((v) => v !== opt)
                        : [...current, opt];
                      onChangeValue(q.key, next.join("|||"));
                    }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label htmlFor={q.key}>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <Input
            id={q.key}
            type="date"
            value={value}
            onChange={(e) => onChangeValue(q.key, e.target.value)}
          />
        </div>
      );

    case "city":
      return (
        <div className="space-y-2">
          <Label htmlFor={q.key}>
            {q.label}
            {q.required && " *"}
          </Label>
          {q.hint && (
            <p className="text-xs text-muted-foreground">{q.hint}</p>
          )}
          <CitySearch
            id={q.key}
            value={value}
            onTextChange={(text) => onChangeValue(q.key, text)}
            onChange={(result: CityResult) => {
              onChangeValue(q.key, result.city);
              onCityChange?.(q.key, result);
            }}
          />
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function IntakeForm({
  requiresBirthData,
  serviceSlug,
  serviceCategory,
  data,
  onChange,
}: IntakeFormProps) {
  const isRelationship = isRelationshipService(serviceSlug);
  const serviceQuestions = getServiceQuestions(serviceSlug);
  const hasServiceQuestions = serviceQuestions.length > 0;

  function update(field: keyof IntakeData, value: string) {
    onChange({ ...data, [field]: value });
  }

  function updateExtra(key: string, value: string) {
    onChange({ ...data, extras: { ...data.extras, [key]: value } });
  }

  return (
    <div className="space-y-5">
      {/* ── Section 1: Your Information ───────────────────────────── */}
      <Section title="Your Information" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Your full name"
              value={data.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </Section>

      {/* ── Section 2: Birth Information (conditional) ─────────── */}
      {requiresBirthData && (
        <Section title="Your Birth Information" defaultOpen>
          <p className="text-xs text-muted-foreground">
            Accurate birth data creates the most precise chart. Birth time is
            especially valuable — check your birth certificate if possible.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date *</Label>
              <Input
                id="birthDate"
                type="date"
                value={data.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthTime">Birth Time</Label>
              <Select
                value={data.birthTime}
                onValueChange={(val) => update("birthTime", val)}
              >
                <SelectTrigger id="birthTime" className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  {TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCity">Birth City</Label>
              <CitySearch
                id="birthCity"
                value={data.birthCity}
                onTextChange={(text) => update("birthCity", text)}
                onChange={(result: CityResult) => {
                  onChange({
                    ...data,
                    birthCity: result.city,
                    birthLat: result.lat,
                    birthLng: result.lng,
                    birthTimezone: result.timezone,
                  });
                }}
              />
            </div>
          </div>

          {data.birthTime && data.birthTime !== "unknown" && (
            <div className="space-y-2">
              <Label htmlFor="birthTimeAccuracy">How accurate is your birth time?</Label>
              <Select
                value={data.birthTimeAccuracy ?? ""}
                onValueChange={(val) => update("birthTimeAccuracy", val)}
              >
                <SelectTrigger id="birthTimeAccuracy" className="w-full">
                  <SelectValue placeholder="Select accuracy..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact — from birth certificate or hospital record</SelectItem>
                  <SelectItem value="close">Close estimate — within 15 minutes</SelectItem>
                  <SelectItem value="approximate">Approximate — within 1–2 hours</SelectItem>
                  <SelectItem value="guess">Best guess — family memory only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </Section>
      )}

      {/* ── Section 3: Second Person (relationship readings) ──── */}
      {isRelationship && (
        <Section
          title="About the Other Person"
          icon={<Heart className="size-4 text-pink-400" />}
          accent="border-pink-500/30"
          defaultOpen
        >
          <p className="text-xs text-muted-foreground">
            For relationship readings, information about the other person helps
            your reader provide much deeper insight — even if they won&apos;t be
            attending the session.
          </p>

          <div className="space-y-2">
            <Label htmlFor="secondPersonAttending">
              Will the other person join the video session?
            </Label>
            <Select
              value={data.secondPersonAttending}
              onValueChange={(val) => update("secondPersonAttending", val)}
            >
              <SelectTrigger id="secondPersonAttending" className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">
                  Yes — they&apos;ll join the call
                </SelectItem>
                <SelectItem value="no">
                  No — just me on the call
                </SelectItem>
                <SelectItem value="maybe">Maybe — not sure yet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(data.secondPersonAttending === "yes" || data.secondPersonAttending === "maybe") && (
            <div className="space-y-2">
              <Label htmlFor="secondPersonEmail">
                Their Email Address{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (optional — we'll send them a video join link)
                </span>
              </Label>
              <Input
                id="secondPersonEmail"
                type="email"
                placeholder="their@email.com"
                value={data.secondPersonEmail}
                onChange={(e) => onChange({ ...data, secondPersonEmail: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="secondPersonName">Their Full Name *</Label>
            <Input
              id="secondPersonName"
              placeholder="Their full name"
              value={data.secondPersonName}
              onChange={(e) => update("secondPersonName", e.target.value)}
            />
          </div>

          {/* Relationship-specific questions */}
          {RELATIONSHIP_QUESTIONS.map((q) => (
            <DynamicQuestion
              key={q.key}
              q={q}
              value={data.extras[q.key] ?? ""}
              onChangeValue={updateExtra}
            />
          ))}

          {/* Second person birth data (for astrology relationship readings) */}
          {requiresBirthData && (
            <div className="mt-2 space-y-4 rounded-lg border border-white/10 p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Their birth information (for chart comparison)
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="secondPersonBirthDate">
                    Their Birth Date
                  </Label>
                  <Input
                    id="secondPersonBirthDate"
                    type="date"
                    value={data.secondPersonBirthDate}
                    onChange={(e) =>
                      update("secondPersonBirthDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondPersonBirthTime">
                    Their Birth Time
                  </Label>
                  <Select
                    value={data.secondPersonBirthTime}
                    onValueChange={(val) =>
                      update("secondPersonBirthTime", val)
                    }
                  >
                    <SelectTrigger
                      id="secondPersonBirthTime"
                      className="w-full"
                    >
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondPersonBirthCity">
                    Their Birth City
                  </Label>
                  <CitySearch
                    id="secondPersonBirthCity"
                    value={data.secondPersonBirthCity}
                    onTextChange={(text) =>
                      update("secondPersonBirthCity", text)
                    }
                    onChange={(result: CityResult) => {
                      onChange({
                        ...data,
                        secondPersonBirthCity: result.city,
                        secondPersonBirthLat: result.lat,
                        secondPersonBirthLng: result.lng,
                        secondPersonBirthTimezone: result.timezone,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Section 4: Your Questions (always shown) ──────────── */}
      <Section title="Your Questions" defaultOpen>
        <div className="space-y-2">
          <Label htmlFor="lifeArea">
            What area of life are you focused on? *
          </Label>
          <Select
            value={data.lifeArea}
            onValueChange={(val) => update("lifeArea", val)}
          >
            <SelectTrigger id="lifeArea" className="w-full">
              <SelectValue placeholder="Select an area" />
            </SelectTrigger>
            <SelectContent>
              {LIFE_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focusQuestion">
            What questions do you want answered? *
          </Label>
          <Textarea
            id="focusQuestion"
            placeholder="Share what's on your mind and what guidance you're seeking..."
            value={data.focusQuestion}
            onChange={(e) => update("focusQuestion", e.target.value)}
            rows={4}
            required
          />
        </div>
      </Section>

      {/* ── Section 5: Service-specific questions ─────────────── */}
      {hasServiceQuestions && (
        <Section
          title={`About Your ${serviceCategory === "astrology" ? "Astrology" : "Tarot"} Reading`}
          icon={<Sparkles className="size-4 text-amber-400" />}
          accent="border-amber-500/30"
          defaultOpen
        >
          <p className="text-xs text-muted-foreground">
            These questions are specific to the reading you&apos;ve chosen. The
            more you share, the deeper your reader can go — but nothing here is
            required unless marked.
          </p>
          {serviceQuestions.map((q) => (
            <DynamicQuestion
              key={q.key}
              q={q}
              value={data.extras[q.key] ?? ""}
              onChangeValue={updateExtra}
              onCityChange={(key, result) => {
                // Store geo data for city-type questions (e.g. solar return location)
                onChange({
                  ...data,
                  extras: {
                    ...data.extras,
                    [key]: result.city,
                    [`${key}Lat`]: String(result.lat),
                    [`${key}Lng`]: String(result.lng),
                    [`${key}Timezone`]: result.timezone,
                  },
                });
              }}
            />
          ))}
        </Section>
      )}

      {/* ── Section 6: Preferences & Comfort (collapsible) ───── */}
      <Section
        title="Preferences & Comfort"
        icon={<Users className="size-4 text-purple-400" />}
        accent="border-purple-500/30"
        defaultOpen={false}
      >
        <p className="text-xs text-muted-foreground">
          Optional — helps your reader tailor the session to you. This
          information also helps our AI provide more personalized prep notes for
          your reader.
        </p>
        {UNIVERSAL_QUESTIONS.map((q) => (
          <DynamicQuestion
            key={q.key}
            q={q}
            value={data.extras[q.key] ?? ""}
            onChangeValue={updateExtra}
          />
        ))}
      </Section>
    </div>
  );
}
