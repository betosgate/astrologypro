"use client";

import { useState, FormEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckInFormProps {
  divinerId: string;
  divinerUsername: string;
  sessionTitle?: string;
  formTitle?: string;
  formSubtitle?: string;
}

type FormState = "idle" | "loading" | "success" | "error";

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Input component ──────────────────────────────────────────────────────────

function Field({
  id,
  label,
  type,
  required,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: "#f5f0e8" }}
      >
        {label}
        {required && (
          <span className="ml-0.5" style={{ color: "#c9a84c" }} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-md border bg-white/[0.04] px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
        style={
          {
            color: "#f5f0e8",
            borderColor: error ? "#ef4444" : "rgba(255,255,255,0.07)",
            "--tw-ring-color": "#c9a84c",
          } as React.CSSProperties
        }
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckInForm({
  divinerUsername,
  formTitle = "Get Your Free Birth Chart Reading",
  formSubtitle = "Join live and get personalized insights",
}: CheckInFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Form values
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [birthTime, setBirthTime] = useState("");

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!firstName.trim()) errors.first_name = "First name is required.";
    if (!lastName.trim()) errors.last_name = "Last name is required.";
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setState("loading");
    setErrorMessage("");

    try {
      const payload: Record<string, string | null> = {
        diviner_username: divinerUsername,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        birth_date: birthDate || null,
        birth_city: birthCity.trim() || null,
        birth_time: birthTime || null,
      };

      // Remove null values
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (v !== null) body[k] = v;
      }

      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        setState("success");
        return;
      }

      let detail = "Something went wrong. Please try again.";
      try {
        const json = (await res.json()) as { detail?: string; title?: string };
        detail = json.detail ?? json.title ?? detail;
      } catch {
        // ignore parse error
      }

      if (res.status === 409) {
        detail = "This diviner is not currently live. Please come back when the session is active.";
      } else if (res.status === 429) {
        detail = "You've already checked in for this session. See you live!";
      }

      setState("error");
      setErrorMessage(detail);
    } catch {
      setState("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  // ─── Success state ────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-xl border px-8 py-10 text-center"
        style={{
          background: "rgba(255,255,255,0.03)",
          borderColor: "rgba(201,168,76,0.3)",
        }}
        role="status"
        aria-live="polite"
      >
        <span className="text-4xl" aria-hidden="true">
          ✨
        </span>
        <h2 className="text-xl font-semibold" style={{ color: "#c9a84c" }}>
          You&apos;re checked in!
        </h2>
        <p className="text-sm" style={{ color: "rgba(184,188,208,0.8)" }}>
          We&apos;ve received your information. Join the live session and watch for your personalized reading.
        </p>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Check-in form"
      className="flex flex-col gap-5"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold" style={{ color: "#f5f0e8" }}>
          {formTitle}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "rgba(184,188,208,0.7)" }}>
          {formSubtitle}
        </p>
      </div>

      {/* Error banner */}
      {state === "error" && errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field
          id="first_name"
          label="First Name"
          type="text"
          required
          value={firstName}
          onChange={setFirstName}
          error={fieldErrors.first_name}
          autoComplete="given-name"
        />
        <Field
          id="last_name"
          label="Last Name"
          type="text"
          required
          value={lastName}
          onChange={setLastName}
          error={fieldErrors.last_name}
          autoComplete="family-name"
        />
      </div>

      <Field
        id="email"
        label="Email"
        type="email"
        required
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
        autoComplete="email"
      />

      <Field
        id="birth_date"
        label="Birth Date"
        type="date"
        value={birthDate}
        onChange={setBirthDate}
      />

      <Field
        id="birth_city"
        label="Birth City"
        type="text"
        value={birthCity}
        onChange={setBirthCity}
        autoComplete="address-level2"
      />

      <Field
        id="birth_time"
        label="Birth Time"
        type="time"
        value={birthTime}
        onChange={setBirthTime}
      />

      <button
        type="submit"
        disabled={state === "loading"}
        className="mt-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: "#c9a84c",
          color: "#06080f",
        }}
        aria-busy={state === "loading"}
      >
        {state === "loading" ? "Checking in…" : "Check In"}
      </button>

      <p className="text-center text-xs" style={{ color: "rgba(184,188,208,0.5)" }}>
        Your information is only used to provide personalized readings.
      </p>
    </form>
  );
}
