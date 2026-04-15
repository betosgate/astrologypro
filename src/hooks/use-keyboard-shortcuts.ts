import { useEffect } from "react";

export interface Shortcut {
  key: string;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  group: string;
  action: () => void;
}

/**
 * Registers a keydown listener for the given shortcuts.
 * Skips events when focus is on an INPUT, TEXTAREA, or SELECT element.
 * Calls event.preventDefault() only for shortcuts that would conflict with
 * browser defaults (metaKey combos like Cmd+S, Cmd+P, Cmd+C).
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Skip when focus is in a form element to avoid interfering with typing
      const target = event.target as HTMLElement;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const metaMatch = shortcut.metaKey
          ? event.metaKey || event.ctrlKey
          : !(event.metaKey || event.ctrlKey);
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

        if (keyMatch && metaMatch && shiftMatch && altMatch) {
          // Only preventDefault for browser-default combos
          if (shortcut.metaKey) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
