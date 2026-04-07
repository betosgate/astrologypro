"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IntakeField, IntakeTemplate } from "@/lib/intake-fields";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface DynamicIntakeFormProps {
  orderId: string;
  template: IntakeTemplate | null;
  productTitle: string;
  clientName?: string | null;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Convert a label string to a stable field key for submission */
function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const MAX_FIELD_LENGTH = 5000;

// ────────────────────────────────────────────────────────────
// Individual field renderers
// ────────────────────────────────────────────────────────────

interface FieldProps {
  field: IntakeField;
  value: string;
  onChange: (key: string, value: string) => void;
  disabled: boolean;
  error?: string;
}

function TextField({ field, value, onChange, disabled }: FieldProps) {
  const key = labelToKey(field.label);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      <Input
        id={`field-${field.id}`}
        type={field.type === "email" ? "email" : "text"}
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={field.placeholder ?? ""}
        disabled={disabled}
        maxLength={MAX_FIELD_LENGTH}
      />
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

function TextareaField({ field, value, onChange, disabled }: FieldProps) {
  const key = labelToKey(field.label);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
        <span className="ml-1 text-xs text-muted-foreground">
          ({value.length}/{MAX_FIELD_LENGTH})
        </span>
      </Label>
      <Textarea
        id={`field-${field.id}`}
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={field.placeholder ?? ""}
        disabled={disabled}
        rows={4}
        maxLength={MAX_FIELD_LENGTH}
      />
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

function DateField({ field, value, onChange, disabled }: FieldProps) {
  const key = labelToKey(field.label);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      <Input
        id={`field-${field.id}`}
        type="date"
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        disabled={disabled}
      />
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

interface TimeFieldProps extends FieldProps {
  unknownKey: string;
  unknownValue: string;
}

function TimeField({ field, value, onChange, disabled, unknownKey, unknownValue }: TimeFieldProps) {
  const key = labelToKey(field.label);
  const isUnknown = unknownValue === "true";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      <div className="flex items-center gap-3">
        <Input
          id={`field-${field.id}`}
          type="time"
          value={value}
          onChange={(e) => onChange(key, e.target.value)}
          disabled={disabled || isUnknown}
          className="w-40"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={isUnknown}
            onChange={(e) => {
              onChange(unknownKey, e.target.checked ? "true" : "false");
              if (e.target.checked) onChange(key, "");
            }}
            disabled={disabled}
            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary"
          />
          Unknown
        </label>
      </div>
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

function SelectField({ field, value, onChange, disabled }: FieldProps) {
  const key = labelToKey(field.label);
  const options = field.options ?? [];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`field-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-400">*</span>}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(key, v)} disabled={disabled}>
        <SelectTrigger id={`field-${field.id}`}>
          <SelectValue placeholder={field.placeholder || "Select an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

function CheckboxField({ field, value, onChange, disabled }: FieldProps) {
  const key = labelToKey(field.label);

  return (
    <div className="space-y-1.5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          id={`field-${field.id}`}
          checked={value === "true"}
          onChange={(e) => onChange(key, e.target.checked ? "true" : "false")}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-primary"
        />
        <span className="text-sm">
          {field.label}
          {field.required && <span className="ml-1 text-red-400">*</span>}
        </span>
      </label>
      {field.help_text && (
        <p className="ml-7 text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

interface BirthDetailsBlockProps {
  field: IntakeField;
  prefix: string; // "" for self, "partner_" for partner
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled: boolean;
}

function BirthDetailsBlock({ field, prefix, values, onChange, disabled }: BirthDetailsBlockProps) {
  const dateKey = `${prefix}birth_date`;
  const timeKey = `${prefix}birth_time`;
  const unknownKey = `${prefix}birth_time_unknown`;
  const cityKey = `${prefix}birth_city`;
  const isUnknown = values[unknownKey] === "true";
  const labelPrefix = prefix === "partner_" ? "Partner's " : "";

  return (
    <div className="space-y-3 rounded-lg border border-white/[0.07] bg-white/[0.015] p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-red-400">*</span>}
        </p>
      </div>

      {/* Birth Date */}
      <div className="space-y-1.5">
        <Label htmlFor={`${field.id}-${prefix}date`}>{labelPrefix}Birth Date</Label>
        <Input
          id={`${field.id}-${prefix}date`}
          type="date"
          value={values[dateKey] ?? ""}
          onChange={(e) => onChange(dateKey, e.target.value)}
          disabled={disabled}
        />
      </div>

      {/* Birth Time */}
      <div className="space-y-1.5">
        <Label htmlFor={`${field.id}-${prefix}time`}>{labelPrefix}Birth Time</Label>
        <div className="flex items-center gap-3">
          <Input
            id={`${field.id}-${prefix}time`}
            type="time"
            value={values[timeKey] ?? ""}
            onChange={(e) => onChange(timeKey, e.target.value)}
            disabled={disabled || isUnknown}
            className="w-40"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isUnknown}
              onChange={(e) => {
                onChange(unknownKey, e.target.checked ? "true" : "false");
                if (e.target.checked) onChange(timeKey, "");
              }}
              disabled={disabled}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary"
            />
            Unknown
          </label>
        </div>
      </div>

      {/* Birth City */}
      <div className="space-y-1.5">
        <Label htmlFor={`${field.id}-${prefix}city`}>{labelPrefix}Birth City</Label>
        <Input
          id={`${field.id}-${prefix}city`}
          value={values[cityKey] ?? ""}
          onChange={(e) => onChange(cityKey, e.target.value)}
          placeholder="City, State/Country"
          disabled={disabled}
        />
      </div>

      {field.help_text && (
        <p className="text-xs text-muted-foreground">{field.help_text}</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Fallback generic form (when template is null)
// ────────────────────────────────────────────────────────────

function FallbackGenericForm({
  orderId,
  productTitle,
  clientName,
}: {
  orderId: string;
  productTitle: string;
  clientName?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState(clientName ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const [birthCity, setBirthCity] = useState("");
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!birthDate) { setError("Please enter your birth date."); return; }
    if (!birthCity.trim()) { setError("Please enter your birth city."); return; }

    const fields: Record<string, string> = {
      full_name: fullName.trim(),
      birth_date: birthDate,
      birth_time: birthTimeUnknown ? "Unknown" : birthTime,
      birth_city: birthCity.trim(),
      question: question.trim(),
      additional_notes: notes.trim(),
    };

    setLoading(true);
    try {
      const res = await fetch(`/api/portal/orders/${orderId}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to submit intake.");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Sparkles className="size-10 text-primary" />
        <p className="font-semibold">Your information has been submitted!</p>
        <p className="text-sm text-muted-foreground">Your diviner will be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Complete the form below to help your diviner prepare your{" "}
        <span className="font-medium text-foreground">{productTitle}</span>.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="g-full-name">Full Name</Label>
        <Input id="g-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-birth-date">Birth Date</Label>
        <Input id="g-birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-birth-time">Birth Time</Label>
        <div className="flex items-center gap-3">
          <Input id="g-birth-time" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} disabled={loading || birthTimeUnknown} className="w-40" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={birthTimeUnknown} onChange={(e) => { setBirthTimeUnknown(e.target.checked); if (e.target.checked) setBirthTime(""); }} disabled={loading} className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary" />
            Unknown
          </label>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-birth-city">Birth City</Label>
        <Input id="g-birth-city" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} placeholder="City, State/Country" disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-question">Your Question or Context <span className="text-xs text-muted-foreground">({question.length}/1000)</span></Label>
        <Textarea id="g-question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What would you like to focus on?" rows={4} maxLength={1000} disabled={loading} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-notes">Additional Notes <span className="text-xs text-muted-foreground">(optional) ({notes.length}/1000)</span></Label>
        <Textarea id="g-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else you would like your diviner to know" rows={3} maxLength={1000} disabled={loading} />
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Submit Intake
      </Button>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Main DynamicIntakeForm
// ────────────────────────────────────────────────────────────

export function DynamicIntakeForm({
  orderId,
  template,
  productTitle,
  clientName,
}: DynamicIntakeFormProps) {
  // Fall back to generic if no template assigned
  if (!template) {
    return (
      <FallbackGenericForm
        orderId={orderId}
        productTitle={productTitle}
        clientName={clientName}
      />
    );
  }

  return (
    <DynamicFormRenderer
      orderId={orderId}
      template={template}
      productTitle={productTitle}
    />
  );
}

// ────────────────────────────────────────────────────────────
// Dynamic renderer (when template is provided)
// ────────────────────────────────────────────────────────────

function DynamicFormRenderer({
  orderId,
  template,
  productTitle,
}: {
  orderId: string;
  template: IntakeTemplate;
  productTitle: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    const sortedFields = [...template.fields].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    for (const field of sortedFields) {
      if (!field.required) continue;

      if (field.type === "birth_details") {
        if (!values["birth_date"]) return `Birth Date is required`;
        if (!values["birth_city"]) return `Birth City is required`;
      } else if (field.type === "partner_birth_details") {
        if (!values["partner_birth_date"]) return `Partner's Birth Date is required`;
        if (!values["partner_birth_city"]) return `Partner's Birth City is required`;
      } else {
        const key = labelToKey(field.label);
        const val = values[key] ?? "";
        if (!val.trim()) {
          return `"${field.label}" is required`;
        }
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Build submission fields — strip internal unknown flags, replace time with "Unknown" text
    const submissionFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (key.endsWith("_unknown")) continue; // skip internal flag fields

      // If time field and corresponding unknown is set, replace with "Unknown"
      if (
        (key === "birth_time" || key === "partner_birth_time") &&
        values[`${key}_unknown`] === "true"
      ) {
        submissionFields[key] = "Unknown";
      } else {
        submissionFields[key] = value;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/portal/orders/${orderId}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: submissionFields }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to submit intake.");
      }

      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Sparkles className="size-10 text-primary" />
        <p className="font-semibold">Your information has been submitted!</p>
        <p className="text-sm text-muted-foreground">Your diviner will be in touch.</p>
      </div>
    );
  }

  const sortedFields = [...template.fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Complete the form below to help your diviner prepare your{" "}
        <span className="font-medium text-foreground">{productTitle}</span>.
      </p>

      {sortedFields.map((field) => {
        const key = labelToKey(field.label);
        const fieldProps: FieldProps = {
          field,
          value: values[key] ?? "",
          onChange: handleChange,
          disabled: loading,
        };

        switch (field.type) {
          case "birth_details":
            return (
              <BirthDetailsBlock
                key={field.id}
                field={field}
                prefix=""
                values={values}
                onChange={handleChange}
                disabled={loading}
              />
            );

          case "partner_birth_details":
            return (
              <BirthDetailsBlock
                key={field.id}
                field={field}
                prefix="partner_"
                values={values}
                onChange={handleChange}
                disabled={loading}
              />
            );

          case "textarea":
            return <TextareaField key={field.id} {...fieldProps} />;

          case "date":
            return <DateField key={field.id} {...fieldProps} />;

          case "time":
            return (
              <TimeField
                key={field.id}
                {...fieldProps}
                unknownKey={`${key}_unknown`}
                unknownValue={values[`${key}_unknown`] ?? "false"}
              />
            );

          case "select":
            return <SelectField key={field.id} {...fieldProps} />;

          case "checkbox":
            return <CheckboxField key={field.id} {...fieldProps} />;

          case "email":
          case "text":
          default:
            return <TextField key={field.id} {...fieldProps} />;
        }
      })}

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
        Submit Intake
      </Button>
    </form>
  );
}
