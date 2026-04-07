"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";

interface IntakeFormProps {
  orderId: string;
  productTitle: string;
  clientName?: string | null;
}

const MAX_TEXTAREA = 1000;

export function IntakeForm({ orderId, productTitle, clientName }: IntakeFormProps) {
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

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!birthDate) {
      setError("Please enter your birth date.");
      return;
    }
    if (!birthCity.trim()) {
      setError("Please enter your birth city.");
      return;
    }
    if (question.length > MAX_TEXTAREA) {
      setError(`Your question exceeds ${MAX_TEXTAREA} characters.`);
      return;
    }
    if (notes.length > MAX_TEXTAREA) {
      setError(`Additional notes exceed ${MAX_TEXTAREA} characters.`);
      return;
    }

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
        <p className="text-sm text-muted-foreground">
          Your diviner will be in touch. ✨
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Complete the form below to help your diviner prepare your{" "}
        <span className="font-medium text-foreground">{productTitle}</span>.
      </p>

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-full-name">Full Name</Label>
        <Input
          id="intake-full-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          required
          disabled={loading}
        />
      </div>

      {/* Birth Date */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-birth-date">Birth Date</Label>
        <Input
          id="intake-birth-date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {/* Birth Time */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-birth-time">Birth Time</Label>
        <div className="flex items-center gap-3">
          <Input
            id="intake-birth-time"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={loading || birthTimeUnknown}
            className="w-40"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={birthTimeUnknown}
              onChange={(e) => {
                setBirthTimeUnknown(e.target.checked);
                if (e.target.checked) setBirthTime("");
              }}
              disabled={loading}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary"
            />
            Unknown
          </label>
        </div>
      </div>

      {/* Birth City */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-birth-city">Birth City</Label>
        <Input
          id="intake-birth-city"
          value={birthCity}
          onChange={(e) => setBirthCity(e.target.value)}
          placeholder="City, State/Country"
          required
          disabled={loading}
        />
      </div>

      {/* Question */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-question">
          Your Question or Context
          <span className="ml-1 text-xs text-muted-foreground">
            ({question.length}/{MAX_TEXTAREA})
          </span>
        </Label>
        <Textarea
          id="intake-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What would you like to focus on in your reading?"
          rows={4}
          maxLength={MAX_TEXTAREA}
          disabled={loading}
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="intake-notes">
          Additional Notes{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
          <span className="ml-1 text-xs text-muted-foreground">
            ({notes.length}/{MAX_TEXTAREA})
          </span>
        </Label>
        <Textarea
          id="intake-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else you would like your diviner to know"
          rows={3}
          maxLength={MAX_TEXTAREA}
          disabled={loading}
        />
      </div>

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
