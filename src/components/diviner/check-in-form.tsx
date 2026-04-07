"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CheckInFormProps {
  /** The diviner's username — used by the API to look up the diviner */
  divinerUsername: string;
  /** Optional active giveaway ID to link this check-in to an entry */
  activeGiveawayId?: string | null;
}

type FormState = "idle" | "submitting" | "success" | "error";

export function CheckInForm({ divinerUsername, activeGiveawayId }: CheckInFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg(null);

    const form = e.currentTarget;
    const data = new FormData(form);

    const body: Record<string, unknown> = {
      diviner_username: divinerUsername,
      first_name: (data.get("first_name") as string)?.trim(),
      last_name: (data.get("last_name") as string)?.trim(),
      email: (data.get("email") as string)?.trim(),
      birth_city: (data.get("birth_city") as string)?.trim() || undefined,
      birth_date: (data.get("birth_date") as string) || undefined,
      birth_time: (data.get("birth_time") as string) || undefined,
    };

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setState("success"); // Already checked in — treat as success
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json.detail ?? "Something went wrong. Please try again.");
        setState("error");
        return;
      }

      // If there's an active giveaway, enter them
      if (activeGiveawayId) {
        const entryName = `${body.first_name} ${body.last_name}`.trim();
        await fetch(`/api/giveaways/${activeGiveawayId}/enter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: entryName, email: body.email }),
        }).catch(() => {
          // Non-blocking: giveaway entry failure doesn't fail the check-in
        });
      }

      setState("success");
    } catch {
      setErrorMsg("Connection error. Please try again.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-950/20 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-500/20">
          <Star className="size-6 text-amber-400" />
        </div>
        <h3 className="font-display text-lg font-semibold text-cream">
          You&apos;re checked in!
        </h3>
        <p className="mt-1 text-sm text-silver/70">
          {activeGiveawayId
            ? "You've been entered in the giveaway. Stay tuned for the draw!"
            : "Thanks for joining the live session."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-400/30 bg-[#1a1208]/60 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Star className="size-5 text-amber-400" />
        <h3 className="font-display text-lg font-semibold text-cream">
          {activeGiveawayId ? "Check In & Enter Giveaway" : "Check In"}
        </h3>
      </div>
      <p className="mb-5 text-sm text-silver/60">
        {activeGiveawayId
          ? "Submit your details to check in and be automatically entered in the giveaway."
          : "Submit your details to check in to the live session."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ci-first-name" className="text-silver/80">
              First Name <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="ci-first-name"
              name="first_name"
              required
              placeholder="Jane"
              className="border-white/10 bg-white/5 text-cream placeholder:text-silver/30"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-last-name" className="text-silver/80">
              Last Name <span className="text-amber-400">*</span>
            </Label>
            <Input
              id="ci-last-name"
              name="last_name"
              required
              placeholder="Smith"
              className="border-white/10 bg-white/5 text-cream placeholder:text-silver/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-email" className="text-silver/80">
            Email <span className="text-amber-400">*</span>
          </Label>
          <Input
            id="ci-email"
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            className="border-white/10 bg-white/5 text-cream placeholder:text-silver/30"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ci-birth-city" className="text-silver/80">
            Birth City{" "}
            <span className="text-silver/40 text-xs">(optional)</span>
          </Label>
          <Input
            id="ci-birth-city"
            name="birth_city"
            placeholder="New York, NY"
            className="border-white/10 bg-white/5 text-cream placeholder:text-silver/30"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ci-birth-date" className="text-silver/80">
              Birth Date{" "}
              <span className="text-silver/40 text-xs">(optional)</span>
            </Label>
            <Input
              id="ci-birth-date"
              name="birth_date"
              type="date"
              className="border-white/10 bg-white/5 text-cream"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-birth-time" className="text-silver/80">
              Birth Time{" "}
              <span className="text-silver/40 text-xs">(optional)</span>
            </Label>
            <Input
              id="ci-birth-time"
              name="birth_time"
              type="time"
              className="border-white/10 bg-white/5 text-cream"
            />
          </div>
        </div>

        {state === "error" && errorMsg && (
          <p className="text-sm text-red-400">{errorMsg}</p>
        )}

        <Button
          type="submit"
          disabled={state === "submitting"}
          className={cn(
            "w-full",
            "bg-amber-500 text-black hover:bg-amber-400"
          )}
        >
          {state === "submitting" ? "Submitting…" : activeGiveawayId ? "Check In & Enter Giveaway" : "Check In"}
        </Button>
      </form>
    </div>
  );
}
