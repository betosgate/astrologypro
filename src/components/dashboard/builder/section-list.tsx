"use client";

import { useCallback } from "react";
import { GripVertical, FileText, Image as ImageIcon, Code } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilder } from "./builder-context";
import type { BlockSlot, BlockType, DivinerServiceBlock } from "@/types/landing-page-builder";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const TYPE_ICONS: Record<BlockType, typeof FileText> = {
  text: FileText,
  image: ImageIcon,
  html: Code,
};

const TYPE_LABELS: Record<BlockType, string> = {
  text: "Text",
  image: "Image",
  html: "HTML",
};

const SLOT_LABELS: Record<BlockSlot, string> = {
  about_diviner: "About Your Diviner",
  extra: "Extra",
};

// ── Sortable block item ────────────────────────────────────────────────────────

function SortableBlockItem({ block }: { block: DivinerServiceBlock }) {
  const { state, selectBlock, toggleBlock } = useBuilder();
  const isSelected = state.selectedBlockId === block.id;
  const Icon = TYPE_ICONS[block.section_type] ?? FileText;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors",
        isSelected
          ? "border-gold/30 bg-gold/8"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]",
      )}
      onClick={() => selectBlock(block.id)}
    >
      <div
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-silver/30 hover:text-silver/60 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </div>
      <Icon className={cn("size-4 shrink-0", isSelected ? "text-gold" : "text-silver/50")} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", isSelected ? "text-gold font-medium" : "text-cream/80")}>
          {block.title || TYPE_LABELS[block.section_type]}
        </p>
        {block.moderation_status === "flagged" && (
          <p className="text-[10px] text-red-400">⚠ Flagged</p>
        )}
        {block.moderation_status === "rejected" && (
          <p className="text-[10px] text-red-400">⚠ Rejected</p>
        )}
        {block.moderation_status === "pending_review" && (
          <p className="text-[10px] text-amber-400/80">Pending review</p>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <Switch
          checked={block.is_enabled}
          onCheckedChange={(checked) => toggleBlock(block.id, checked)}
          className="scale-75"
        />
      </div>
    </div>
  );
}

// ── Per-slot group ─────────────────────────────────────────────────────────────

function SlotGroup({ slot, blocks }: { slot: BlockSlot; blocks: DivinerServiceBlock[] }) {
  const { reorderSlot } = useBuilder();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = [...blocks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      reorderSlot(slot, reordered.map((b) => b.id));
    },
    [blocks, slot, reorderSlot],
  );

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-silver/50 pl-1">
        {SLOT_LABELS[slot]}
        <span className="ml-2 text-[10px] font-normal text-silver/30">
          ({blocks.length})
        </span>
      </p>
      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/[0.06] bg-white/[0.01] px-3 py-4 text-xs text-silver/40 text-center">
          No blocks yet
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((b) => (
              <SortableBlockItem key={b.id} block={b} />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

// ── Section list ──────────────────────────────────────────────────────────────

export function SectionList() {
  const { state } = useBuilder();
  const { blocks } = state;

  return (
    <div className="space-y-5">
      <SlotGroup slot="about_diviner" blocks={blocks.about_diviner} />
      <SlotGroup slot="extra" blocks={blocks.extra} />
    </div>
  );
}
