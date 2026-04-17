"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBuilder } from "./builder-context";
import { cn } from "@/lib/utils";

interface AvailableType {
  type: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  remaining_slots: number;
}

function getIcon(name: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon className="size-5" /> : <Plus className="size-5" />;
}

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  media: "Media",
  engagement: "Engagement",
  navigation: "Navigation",
};

export function AddSectionDialog() {
  const { state, addSection } = useBuilder();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const available = state.availableSectionTypes;

  const byCategory: Record<string, AvailableType[]> = {};
  for (const t of available) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  async function handleAdd(type: string) {
    setAdding(type);
    setOpen(false);
    await addSection(type);
    setAdding(null);
  }

  const allAtMax = available.every((t) => t.remaining_slots === 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-dashed border-white/20 text-silver/60 hover:border-gold/30 hover:text-gold"
          disabled={!!adding || allAtMax}
        >
          <Plus className="mr-2 size-4" />
          {adding ? `Adding ${adding.replace(/_/g, " ")}...` : "Add Section"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Section</DialogTitle>
        </DialogHeader>

        {available.length === 0 ? (
          <div className="py-8 text-center text-sm text-silver/50">
            All section types have reached their maximum limit for this page.
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const types = byCategory[cat] ?? [];
              if (types.length === 0) return null;
              return (
                <div key={cat}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-silver/50">
                    {label}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {types.map((t) => {
                      const atMax = t.remaining_slots === 0;
                      return (
                        <button
                          key={t.type}
                          onClick={() => !atMax && handleAdd(t.type)}
                          disabled={atMax}
                          className={cn(
                            "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                            atMax
                              ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-gold/20 hover:bg-gold/5 cursor-pointer"
                          )}
                        >
                          <div className={cn(
                            "flex size-9 items-center justify-center rounded-lg",
                            atMax ? "bg-silver/10 text-silver/30" : "bg-gold/10 text-gold"
                          )}>
                            {getIcon(t.icon)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-cream">{t.label}</p>
                            <p className="text-[11px] text-silver/50 leading-snug mt-0.5">{t.description}</p>
                          </div>
                          <Badge className="text-[10px] px-1.5 py-0.5 bg-white/[0.04] text-silver/40 border-white/[0.06]">
                            {atMax ? "Max reached" : `${t.remaining_slots} remaining`}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
