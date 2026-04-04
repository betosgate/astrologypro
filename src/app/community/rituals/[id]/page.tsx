"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Loader2, AlertCircle, Play } from "lucide-react";
import { formatDate } from "@/lib/format";

type RitualConfig = {
  id: string;
  ritual_name: string;
  ritual_tags: string[];
  created_at: string;
  updated_at: string;
};

// A dynamic ritual is one with more than one tag (beyond presets)
function isDynamic(tags: string[]): boolean {
  return tags.length > 1;
}

export default function RitualResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [ritual, setRitual] = useState<RitualConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [begun, setBegun] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await fetch(`/api/community/rituals/${id}`);
      if (!res.ok) {
        setError("Ritual not found.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRitual(data.ritual);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ritual) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {error ?? "Ritual not found."}
        </div>
        <Button variant="outline" asChild>
          <Link href="/community/rituals">← Back to My Rituals</Link>
        </Button>
      </div>
    );
  }

  const dynamic = isDynamic(ritual.ritual_tags);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/community/rituals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← My Rituals
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <Flame className="size-5 text-orange-500" />
          <h1 className="text-2xl font-bold tracking-tight">{ritual.ritual_name}</h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Saved {formatDate(ritual.created_at)}
        </p>
      </div>

      {/* Ritual composition summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ritual Composition</CardTitle>
          <CardDescription>
            {ritual.ritual_tags.length} invocation component
            {ritual.ritual_tags.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {ritual.ritual_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic ritual — pre-start screen */}
      {dynamic && !begun ? (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="space-y-4 py-8 text-center">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Flame className="size-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Prepare the Sacred Space</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                Your ritual contains {ritual.ritual_tags.length} components. Take a moment to centre
                yourself and prepare your space before beginning.
              </p>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Components: Opening → {ritual.ritual_tags.filter((t) =>
                !t.includes("Ritual_Opening") && !t.includes("Ritual_Closing")
              ).length} invocations → Closing
            </p>
            <Button size="lg" onClick={() => setBegun(true)}>
              <Play className="mr-2 size-4" />
              Begin the Ritual
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Active ritual display — sequence placeholder */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="size-4 text-orange-500" />
              {dynamic ? "Ritual in Progress" : "Your Ritual"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {dynamic
                ? "Work through each component in sequence. The ritual opens with the Opening, proceeds through the invocations below, and closes with the Closing."
                : "This is a standard preset ritual. Follow the instructions and return here when complete."}
            </p>

            {/* Sequence list */}
            <ol className="space-y-2">
              {ritual.ritual_tags.map((tag, i) => (
                <li
                  key={tag}
                  className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{tag.replace(/_/g, " ")}</span>
                  {(tag.includes("Opening") || tag.includes("Closing")) && (
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      {tag.includes("Opening") ? "Opening" : "Closing"}
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/community/rituals")}>
          Back to My Rituals
        </Button>
        {dynamic && begun && (
          <Button
            variant="ghost"
            onClick={() => setBegun(false)}
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
