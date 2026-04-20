"use client";

import { useCallback } from "react";
import { Lock, GripVertical, Eye, EyeOff } from "lucide-react";
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
import { SECTION_TYPES } from "@/lib/landing-page-section-types";
import { useBuilder } from "./builder-context";
import type { LandingPageSection } from "@/types/landing-page-builder";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// ── Sortable item ──────────────────────────────────────────────────────────────

function SortableSectionItem({ section }: { section: LandingPageSection }) {
  const { state, selectSection, toggleSection } = useBuilder();
  const typeDef = SECTION_TYPES[section.section_type];
  const isReorderable = typeDef?.is_reorderable !== false;
  const isSelected = state.selectedSectionId === section.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: !isReorderable,
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
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
      )}
      onClick={() => selectSection(section.id)}
    >
      {/* Drag handle or lock */}
      {isReorderable ? (
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-silver/30 hover:text-silver/60 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </div>
      ) : (
        <Lock className="size-4 shrink-0 text-silver/30" />
      )}

      {/* Section name */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", isSelected ? "text-gold font-medium" : "text-cream/80")}>
          {typeDef?.label ?? section.section_type}
        </p>
        {section.is_draft && section.published_content_json && (
          <p className="text-[10px] text-amber-400/70">Unsaved changes</p>
        )}
        {section.moderation_status === "flagged" && (
          <p className="text-[10px] text-red-400">⚠ Flagged</p>
        )}
      </div>

      {/* Visibility toggle — only for custom sections */}
      {!section.is_system && (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={section.is_enabled}
            onCheckedChange={(checked) => toggleSection(section.id, checked)}
            className="scale-75"
          />
        </div>
      )}
    </div>
  );
}

// ── Section list ───────────────────────────────────────────────────────────────

export function SectionList() {
  const { state, reorderSections } = useBuilder();
  const { sections } = state;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Separate system (fixed) from sortable sections
  const systemSections = sections.filter((s) => {
    const td = SECTION_TYPES[s.section_type];
    return td?.is_reorderable === false;
  });
  const customSections = sections.filter((s) => {
    const td = SECTION_TYPES[s.section_type];
    return td?.is_reorderable !== false;
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = customSections.findIndex((s) => s.id === active.id);
    const newIndex = customSections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Recalculate display_order for custom sections
    const reordered = [...customSections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const ordered = reordered.map((s, i) => ({
      id: s.id,
      display_order: 100 + (i + 1) * 10, // custom sections start at 100
    }));

    reorderSections(ordered);
  }, [customSections, reorderSections]);

  return (
    <div className="space-y-1.5">
      {/* System sections (non-draggable, shown in fixed positions) */}
      {systemSections.map((s) => (
        <SortableSectionItem key={s.id} section={s} />
      ))}

      {/* Custom sections — drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={customSections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {customSections.map((s) => (
            <SortableSectionItem key={s.id} section={s} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
