"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptyIntakeState,
  type ServiceTemplateBirthInput,
  type ServiceTemplateCityOption,
  type ServiceTemplateFormConfig,
  type ServiceTemplateIntakeState,
  validateServiceTemplateIntakeState,
} from "@/lib/service-template-form";

interface TemplateIntakeFormProps {
  config: ServiceTemplateFormConfig;
  templateName: string;
  templateSlug: string;
  embedded?: boolean;
}

interface TemplateCityAutocompleteProps {
  id: string;
  label: string;
  value: ServiceTemplateCityOption | null;
  onSelect: (city: ServiceTemplateCityOption | null) => void;
  required?: boolean;
}

function TemplateCityAutocomplete({
  id,
  label,
  value,
  onSelect,
  required = false,
}: TemplateCityAutocompleteProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<ServiceTemplateCityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function searchCities(nextQuery: string) {
    if (nextQuery.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/astro/city-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: nextQuery.trim() }),
      });
      const json = await res.json();
      const nextResults = Array.isArray(json.results)
        ? (json.results as ServiceTemplateCityOption[])
        : [];
      setResults(nextResults);
      setOpen(nextResults.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <div className="relative">
        <Input
          id={id}
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            onSelect(null);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              void searchCities(nextQuery);
            }, 250);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          autoComplete="off"
          placeholder="Search city"
          className="border-white/10 bg-white/[0.03] text-cream placeholder:text-silver/35"
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-silver/50" />
        )}
        {open && results.length > 0 && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-white/10 bg-cosmos-950/95 shadow-xl backdrop-blur">
            {results.map((result) => (
              <button
                key={`${result.label}-${result.lat}-${result.lng}`}
                type="button"
                className="block w-full border-b border-white/5 px-3 py-3 text-left last:border-b-0 hover:bg-white/[0.03]"
                onClick={() => {
                  onSelect(result);
                  setQuery(result.label);
                  setOpen(false);
                }}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gold/80" />
                  <div>
                    <p className="text-sm font-medium text-cream">{result.label}</p>
                    <p className="text-xs text-silver/50">{result.timezone.name || result.timezone.utcOffset}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BirthDetailsCard({
  title,
  idPrefix,
  value,
  onChange,
}: {
  title: string;
  idPrefix: string;
  value: ServiceTemplateBirthInput;
  onChange: (next: ServiceTemplateBirthInput) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-display text-xl font-semibold text-cream">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-dob`}>Date of Birth *</Label>
          <Input
            id={`${idPrefix}-dob`}
            type="date"
            value={value.dob}
            onChange={(event) => onChange({ ...value, dob: event.target.value })}
            className="border-white/10 bg-white/[0.03] text-cream"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tob`}>Time of Birth *</Label>
          <Input
            id={`${idPrefix}-tob`}
            type="time"
            value={value.tob}
            onChange={(event) => onChange({ ...value, tob: event.target.value })}
            className="border-white/10 bg-white/[0.03] text-cream"
          />
        </div>
      </div>
      <div className="mt-4">
        <TemplateCityAutocomplete
          id={`${idPrefix}-city`}
          label="Birth City"
          value={value.city}
          required
          onSelect={(city) => onChange({ ...value, city })}
        />
      </div>
    </div>
  );
}

export function TemplateIntakeForm({
  config,
  templateName,
  templateSlug,
  embedded = false,
}: TemplateIntakeFormProps) {
  const router = useRouter();
  const [state, setState] = useState<ServiceTemplateIntakeState>(createEmptyIntakeState);
  const [submitting, setSubmitting] = useState(false);
  const requiresPartner = config.mode === "couple";

  function updateBirth(personKey: "person1" | "person2", next: ServiceTemplateBirthInput) {
    setState((current) => ({ ...current, [personKey]: next }));
  }

  async function continueFlow() {
    const validationError = validateServiceTemplateIntakeState(config, state);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          `template-intake:${templateSlug}`,
          JSON.stringify(state),
        );
      }

      if (embedded) {
        toast.success("Preview form validated. Public flow continues to booking.");
        return;
      }

      const res = await fetch(`/api/services/${encodeURIComponent(templateSlug)}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: state }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to save intake submission.");
      }

      router.push(
        typeof json.next_url === "string"
          ? json.next_url
          : `/book/demo?template=${encodeURIComponent(templateSlug)}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await continueFlow();
  }

  const Container = embedded ? "div" : "form";

  return (
    <Container
      id="template-intake-form"
      className="scroll-mt-20 space-y-6"
      onSubmit={embedded ? undefined : handleSubmit}
    >
      <div className="rounded-3xl border border-gold/15 bg-gold/[0.04] p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold/70">Intake Form</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-cream md:text-4xl">
              Start your {templateName} request
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-silver/65">
              Fill in the required birth details and focus notes so the reading can be prepared with the right context before booking.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-cosmos-950/50 px-4 py-3 text-xs text-silver/60">
            {requiresPartner
              ? "Two-person compatibility intake"
              : "Single-person astrology intake"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <BirthDetailsCard
            title={requiresPartner ? "Person 1" : "Birth Details"}
            idPrefix="person1"
            value={state.person1}
            onChange={(next) => updateBirth("person1", next)}
          />
          {requiresPartner ? (
            <BirthDetailsCard
              title="Person 2"
              idPrefix="person2"
              value={state.person2}
              onChange={(next) => updateBirth("person2", next)}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="font-display text-xl font-semibold text-cream">What this form is for</h3>
              <ul className="mt-4 space-y-3 text-sm text-silver/65">
                <li>Birth details help calculate the right chart and timing references.</li>
                <li>Your extra notes help shape the focus of the session.</li>
                <li>You will continue to booking after this step.</li>
              </ul>
            </div>
          )}
        </div>

        {(config.fields.areaOfInquiry ||
          config.fields.question ||
          config.fields.futureWeek ||
          config.fields.futureMonth) && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {config.fields.areaOfInquiry && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="areaOfInquiry">Area of Inquiry</Label>
                <Textarea
                  id="areaOfInquiry"
                  value={state.areaOfInquiry}
                  onChange={(event) =>
                    setState((current) => ({ ...current, areaOfInquiry: event.target.value }))
                  }
                  rows={3}
                  placeholder="Career, relationship, relocation, timing, spiritual growth..."
                  className="border-white/10 bg-white/[0.03] text-cream placeholder:text-silver/35"
                />
              </div>
            )}

            {config.fields.question && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="question">Specific Question *</Label>
                <Textarea
                  id="question"
                  value={state.question}
                  onChange={(event) =>
                    setState((current) => ({ ...current, question: event.target.value }))
                  }
                  rows={4}
                  placeholder="State the exact question you want this horary reading to answer."
                  className="border-white/10 bg-white/[0.03] text-cream placeholder:text-silver/35"
                />
              </div>
            )}

            {config.fields.futureWeek && (
              <div className="space-y-2">
                <Label htmlFor="futureWeek">Future Week</Label>
                <Input
                  id="futureWeek"
                  value={state.futureWeek}
                  onChange={(event) =>
                    setState((current) => ({ ...current, futureWeek: event.target.value }))
                  }
                  placeholder="e.g. Week of May 12"
                  className="border-white/10 bg-white/[0.03] text-cream placeholder:text-silver/35"
                />
              </div>
            )}

            {config.fields.futureMonth && (
              <div className="space-y-2">
                <Label htmlFor="futureMonth">Future Month</Label>
                <Input
                  id="futureMonth"
                  value={state.futureMonth}
                  onChange={(event) =>
                    setState((current) => ({ ...current, futureMonth: event.target.value }))
                  }
                  placeholder="e.g. September 2026"
                  className="border-white/10 bg-white/[0.03] text-cream placeholder:text-silver/35"
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-silver/50">
            After this step you will continue into the booking flow.
          </p>
          <Button
            type={embedded ? "button" : "submit"}
            className="bg-gold text-cosmos-900 hover:bg-gold-light"
            disabled={submitting}
            onClick={embedded ? () => void continueFlow() : undefined}
          >
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Send className="mr-2 size-4" />
            )}
            Continue to Booking
          </Button>
        </div>
      </div>
    </Container>
  );
}
