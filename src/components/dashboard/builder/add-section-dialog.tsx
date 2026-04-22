"use client";

import { useState } from "react";
import { Plus, FileText, Image as ImageIcon, Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBuilder } from "./builder-context";
import { cn } from "@/lib/utils";
import type { BlockSlot, BlockType } from "@/types/landing-page-builder";

const SLOT_LABELS: Record<BlockSlot, string> = {
  about_diviner: "About Your Diviner",
  extra: "Extra",
};

const SLOT_DESCRIPTIONS: Record<BlockSlot, string> = {
  about_diviner:
    "Rendered after the hardcoded 'About Your Diviner' card on the public page.",
  extra: "Rendered between the FAQ and the final CTA on the public page.",
};

const TYPE_ICON: Record<BlockType, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  html: Code,
};

const TYPE_LABEL: Record<BlockType, string> = {
  text: "Text",
  image: "Image",
  html: "HTML",
};

const TYPE_DESCRIPTION: Record<BlockType, string> = {
  text: "Plain text with optional title and paragraphs.",
  image: "Single image with an optional alt-text title.",
  html: "Custom HTML, sanitized server-side.",
};

export function AddSectionDialog() {
  const { state, addBlock } = useBuilder();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [slot, setSlot] = useState<BlockSlot>("about_diviner");

  const currentCount =
    slot === "about_diviner" ? state.blocks.about_diviner.length : state.blocks.extra.length;
  const slotConfig = state.slotConfigs.find((s) => s.slot === slot);
  const cap = slotConfig?.max_per_slot ?? 0;
  const remaining = cap > 0 ? cap - currentCount : Infinity;
  const slotFull = remaining <= 0;

  async function handleAdd(type: BlockType) {
    setAdding(true);
    await addBlock({ slot, section_type: type });
    setAdding(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-dashed border-white/20 text-silver/60 hover:border-gold/30 hover:text-gold"
        >
          <Plus className="mr-1.5 size-3.5" /> Add Block
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a block</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-silver/50">
              Slot
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["about_diviner", "extra"] as BlockSlot[]).map((s) => {
                const isActive = slot === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      isActive
                        ? "border-gold/40 bg-gold/8"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/10",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-gold" : "text-cream",
                      )}
                    >
                      {SLOT_LABELS[s]}
                    </p>
                    <p className="text-[11px] text-silver/50 leading-snug mt-0.5">
                      {SLOT_DESCRIPTIONS[s]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-silver/50">
                Block type
              </p>
              <p className="text-[11px] text-silver/40">
                {slotFull
                  ? "Slot full"
                  : `${Number.isFinite(remaining) ? remaining : "∞"} remaining in ${SLOT_LABELS[slot]}`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["text", "image", "html"] as BlockType[]).map((type) => {
                const Icon = TYPE_ICON[type];
                const disabled = slotFull || adding;
                return (
                  <button
                    key={type}
                    onClick={() => !disabled && handleAdd(type)}
                    disabled={disabled}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors",
                      disabled
                        ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-gold/20 hover:bg-gold/5 cursor-pointer",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        disabled ? "bg-silver/10 text-silver/30" : "bg-gold/10 text-gold",
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cream">{TYPE_LABEL[type]}</p>
                      <p className="text-[11px] text-silver/50 leading-snug mt-0.5">
                        {TYPE_DESCRIPTION[type]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
