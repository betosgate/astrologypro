/**
 * DEPRECATED — the V2 public route no longer renders "sections" as the whole
 * page. The legacy hardcoded template handles hero / pricing / about / FAQ /
 * final CTA; diviner-added blocks (text / image / html) render through
 * `<BlockRenderer />` in the two fixed slots. See
 * `src/components/landing/block-renderer.tsx`.
 *
 * This stub is kept only so existing imports compile while the public route
 * is migrated (Task 02). It renders nothing.
 *
 * Removed in Deploy 2 of docs/tasks/2026-04-21/landing-page-simplification.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export function SectionRenderer(_props: any): null {
  return null;
}

// Keep the context type export so downstream `import type` lines don't break.
export interface SectionRendererContext {
  service: {
    name: string;
    base_price: number;
    duration_minutes: number;
    [k: string]: unknown;
  };
  diviner: {
    username: string;
    display_name: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
