"use client";

/**
 * Base utilities shared by all section editors.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBuilder } from "../builder-context";
import type { LandingPageSection } from "@/types/landing-page-builder";
import { cn } from "@/lib/utils";

export interface EditorProps {
  section: LandingPageSection;
}

/** Hook: manages local form state, save/revert */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEditorForm<T extends Record<string, any>>(
  section: LandingPageSection,
  initial: T
) {
  const { updateSection } = useBuilder();
  const [values, setValues] = useState<T>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof T>(key: K, value: T[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function revert() {
    setValues(initial);
  }

  async function save() {
    setSaving(true);
    await updateSection(section.id, { content_json: values });
    setSaving(false);
  }

  return { values, set, revert, save, saving };
}

/** Save / Revert action bar */
export function EditorActions({
  onSave,
  onRevert,
  saving,
  disabled,
}: {
  onSave: () => void;
  onRevert: () => void;
  saving: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] pt-4 mt-4">
      <Button
        size="sm"
        variant="ghost"
        onClick={onRevert}
        disabled={saving}
        className="text-silver/50 hover:text-cream"
      >
        Revert
      </Button>
      <Button
        size="sm"
        onClick={onSave}
        disabled={saving || disabled}
        className="bg-gold hover:bg-gold-light text-cosmos-900 font-semibold"
      >
        {saving ? "Saving..." : "Save Section"}
      </Button>
    </div>
  );
}

/** Labelled form field wrapper */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium text-silver/70">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-silver/40">{hint}</p>}
    </div>
  );
}

/** Standard text input with field wrapper */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="bg-white/[0.04] border-white/10 text-cream placeholder:text-silver/30"
        />
        {maxLength && (
          <span className="absolute right-2 bottom-2 text-[10px] text-silver/30">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </Field>
  );
}

/** Standard textarea with field wrapper */
export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
  maxLength,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 4}
        maxLength={maxLength}
        className="bg-white/[0.04] border-white/10 text-cream placeholder:text-silver/30 resize-none"
      />
    </Field>
  );
}
