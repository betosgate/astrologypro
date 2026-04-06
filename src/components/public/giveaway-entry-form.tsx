"use client";

import { useState } from "react";

type FormState = "idle" | "submitting" | "success" | "duplicate" | "full" | "error";

interface Props {
  giveawayId: string;
  entryFields: string[];
}

function fieldLabel(field: string): string {
  return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
}

export function GiveawayEntryForm({ giveawayId, entryFields }: Props) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});

  const extraFields = entryFields.filter(
    (f) => f !== "name" && f !== "email"
  );

  function handleChange(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");
    setErrorMessage("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload: Record<string, string> = {
      name: (data.get("name") as string) ?? "",
      email: (data.get("email") as string) ?? "",
    };
    for (const field of extraFields) {
      payload[field] = (data.get(field) as string) ?? "";
    }

    try {
      const res = await fetch(`/api/giveaways/${giveawayId}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        setFormState("success");
        return;
      }

      const body = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const title: string = body?.title ?? "";
        if (title === "Already entered") {
          setFormState("duplicate");
        } else if (title === "Giveaway full") {
          setFormState("full");
        } else {
          setFormState("error");
          setErrorMessage(body?.detail ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setFormState("error");
      setErrorMessage(body?.detail ?? "Something went wrong. Please try again.");
    } catch {
      setFormState("error");
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  if (formState === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="text-5xl" role="img" aria-label="Confetti">
          🎉
        </span>
        <p className="text-lg font-semibold text-[#f5f0e8]">
          {"You're entered!"}
        </p>
        <p className="text-sm text-[#f5f0e8]/60">Good luck!</p>
      </div>
    );
  }

  if (formState === "duplicate") {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-200">
        {"You've already entered with this email."}
      </div>
    );
  }

  if (formState === "full") {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
        All spots have been filled.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-[#f5f0e8]/80"
        >
          Name <span className="text-[#c9a84c]" aria-hidden>*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={values["name"] ?? ""}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/40 transition-colors"
          placeholder="Your name"
          disabled={formState === "submitting"}
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#f5f0e8]/80"
        >
          Email <span className="text-[#c9a84c]" aria-hidden>*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={values["email"] ?? ""}
          onChange={(e) => handleChange("email", e.target.value)}
          className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/40 transition-colors"
          placeholder="your@email.com"
          disabled={formState === "submitting"}
        />
      </div>

      {/* Extra fields */}
      {extraFields.map((field) => (
        <div key={field} className="space-y-1.5">
          <label
            htmlFor={field}
            className="block text-sm font-medium text-[#f5f0e8]/80"
          >
            {fieldLabel(field)}
          </label>
          <input
            id={field}
            name={field}
            type="text"
            value={values[field] ?? ""}
            onChange={(e) => handleChange(field, e.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 outline-none focus:border-[#c9a84c]/60 focus:ring-1 focus:ring-[#c9a84c]/40 transition-colors"
            placeholder={fieldLabel(field)}
            disabled={formState === "submitting"}
          />
        </div>
      ))}

      {/* Error */}
      {formState === "error" && errorMessage && (
        <p className="text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === "submitting"}
        className="mt-2 w-full rounded-lg bg-[#c9a84c] px-4 py-3 text-sm font-semibold text-[#06080f] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {formState === "submitting" ? "Entering…" : "Enter Giveaway"}
      </button>
    </form>
  );
}
