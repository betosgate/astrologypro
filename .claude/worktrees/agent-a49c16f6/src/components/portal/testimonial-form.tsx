"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialFormProps {
  divinerId: string;
  divinerName: string;
  serviceType: string;
  bookingId: string;
  onSuccess?: () => void;
}

export function TestimonialForm({
  divinerId,
  divinerName,
  serviceType,
  bookingId,
  onSuccess,
}: TestimonialFormProps) {
  const supabase = createClient();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (!text.trim()) {
      setError("Please write a review.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Not authenticated.");
        return;
      }

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) {
        setError("Client record not found.");
        return;
      }

      const { error: insertError } = await supabase
        .from("testimonials")
        .insert({
          client_id: client.id,
          diviner_id: divinerId,
          booking_id: bookingId,
          rating,
          text: text.trim(),
          service_type: serviceType,
          status: "pending",
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSubmitted(true);
      onSuccess?.();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-3 py-4 text-center">
        <CheckCircle className="mx-auto size-10 text-green-500" />
        <div>
          <p className="font-medium">Thank you!</p>
          <p className="text-sm text-muted-foreground">
            Your review will be visible once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rate your experience with{" "}
        <span className="font-medium text-foreground">{divinerName}</span> for{" "}
        <span className="font-medium text-foreground">{serviceType}</span>.
      </p>

      {/* Star Rating */}
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="rounded p-0.5 transition-colors hover:bg-muted"
              aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="review-text">Your Review</Label>
        <Textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
