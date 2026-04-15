"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Shortcut } from "@/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

/** Render a key combination as styled keyboard key badge(s). */
function KeyBadge({ shortcut }: { shortcut: Shortcut }) {
  const keys: string[] = [];

  if (shortcut.metaKey) {
    // Show platform-agnostic modifier
    keys.push("Ctrl");
  }
  if (shortcut.shiftKey) keys.push("Shift");
  if (shortcut.altKey) keys.push("Alt");
  keys.push(shortcut.key.toUpperCase());

  return (
    <div className="flex items-center gap-1">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-border bg-muted text-[11px] font-mono font-medium shadow-sm min-w-[22px]"
        >
          {k}
        </kbd>
      ))}
    </div>
  );
}

export function KeyboardShortcutsModal({
  open,
  onClose,
  shortcuts,
}: KeyboardShortcutsModalProps) {
  // Group shortcuts by their group field
  const groups = shortcuts.reduce<Record<string, Shortcut[]>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push(s);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⌨</span>
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {Object.entries(groups).map(([group, groupShortcuts]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group}
              </h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/40">
                  {groupShortcuts.map((s, i) => (
                    <tr key={i} className="py-1.5">
                      <td className="py-1.5 pr-4 w-36">
                        <KeyBadge shortcut={s} />
                      </td>
                      <td className="py-1.5 text-muted-foreground">
                        {s.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground mt-4 border-t pt-3">
          Shortcuts are disabled when a text input or dropdown is focused.
        </p>
      </DialogContent>
    </Dialog>
  );
}
