"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, BookOpen, Moon, Sparkles, ChevronRight, Loader2 } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "12-Week Foundation Training",
    body: "Week-by-week structured learning with audio introductions from Beto and in-depth reading material.",
  },
  {
    icon: Moon,
    title: "36-Decan Year-Long Practice",
    body: "Work through all 36 decans of the zodiac, each with a pre-built ritual, scrying journal, and mundane impact log.",
  },
  {
    icon: Star,
    title: "Ritual Performer",
    body: "Step-through ritual interface per decan — invocations, gates, and sequences fully prepared for you.",
  },
  {
    icon: Sparkles,
    title: "Priest/Priestess Graduation",
    body: "Complete all 36 decans and graduate to the rank of Priest or Priestess within the tradition.",
  },
];

export default function UpgradeToMysterySchoolPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/community/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipType: "mystery_school",
          planType: "individual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to initiate checkout");
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Star className="size-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mystery School</h1>
        <p className="text-muted-foreground text-lg">
          Deepen your practice with the full year-long Mystery School curriculum.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-sm px-3 py-1">$97 enrollment fee</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">then $27 / month</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <CardHeader className="pb-2">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <Icon className="size-4 text-primary" />
                </div>
                <CardTitle className="text-sm">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 text-center space-y-4">
          <div>
            <p className="font-semibold text-lg">Ready to begin your Mystery School journey?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your current Perennial Mandalism subscription will be replaced by your Mystery School membership.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button size="lg" onClick={handleEnroll} disabled={loading} className="gap-2">
            {loading ? (
              <><Loader2 className="size-4 animate-spin" />Redirecting to checkout…</>
            ) : (
              <>Enroll in Mystery School <ChevronRight className="size-4" /></>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Secure checkout via Stripe. Cancel anytime after the first month.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
