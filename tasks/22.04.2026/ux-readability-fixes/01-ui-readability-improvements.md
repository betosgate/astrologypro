# UI/UX Task - Resolve Low Contrast Readability Issues in Community Banners

- Status: Planned
- Priority: P2
- Area: Frontend / UI / UX
- Files:
  - `src/app/community/family/page.tsx`
  - `src/app/community/family/[id]/page.tsx`
  - `src/app/community/charts/page.tsx`
  - `src/app/community/transits/page.tsx`
  - `src/app/community/mundane/[entityId]/page.tsx`

---

## Problem

Several informational banners and notice blocks in the Community section are difficult to read, especially in dark mode. The primary issues are:

1. **Low Contrast:** Using `bg-amber-50/40` on a dark background results in a muddy grey appearance that clashes with the dark theme.
2. **Invisible Text:** Using dark text colors like `text-amber-800` or `text-amber-700` on dark backgrounds makes the information almost unreadable.
3. **Inconsistent Dark Mode Support:** Some banners lack `dark:` variant classes entirely.

Example observed in `/community/family` and `/community/transits`:
- Background: `bg-amber-50/40` (appears grey-ish on dark)
- Text: `text-amber-800` (is dark brown/orange, invisible on dark)

## Proposed UX Improvements

### 1. Adopt the Standard Alert Component
Instead of manually styling `Card` components for simple notices, use the `@/components/ui/alert` component. This ensures consistency with the rest of the application's design system.

### 2. Standardize "Warning/Info" Palette for Dark Mode
For blocks that must remain custom:
- **Background:** Use `bg-amber-500/10` or `bg-amber-950/20` for a subtle gold tint that works on dark backgrounds.
- **Text:** Use `text-amber-400` or `text-amber-200` for high legibility.
- **Icon:** Use `text-amber-500` for the accent icon.

### 3. Ensure Theme Awareness
Every styled block should have appropriate `dark:` prefixes or use CSS variables (e.g., `text-foreground`, `bg-accent`) that automatically adjust.

## Acceptance Criteria

- [ ] All banners in the specified files meet WCAG AA contrast standards for readability.
- [ ] Banners look premium and integrated with the "Astrology Pro" dark aesthetic.
- [ ] "Individual Plan" upgrade prompt in `/community/family` is clearly readable.
- [ ] "Transits generating soon" notice in `/community/transits` is clearly readable.
- [ ] Foundational chart card in `/community/mundane/[entityId]` is optimized for dark mode legibility.

## QA Checklist

- [ ] View `/community/family` on a dark theme and verify the "Individual Plan" banner.
- [ ] View `/community/transits` on a dark theme and verify the "Transits generating soon" banner.
- [ ] Check `/community/family/[id]` for any membership-related notices.
- [ ] Check `/community/mundane/[entityId]` for the foundation chart card contrast.
- [ ] Verify that no text is "lost" against the background in any of these views.

## Important Constraints

- Do not change the underlying logic for when these banners appear.
- Maintain the "Amber/Gold" color scheme for information/warnings as it fits the brand, but adjust the specific shades for legibility.
- Use the existing `Alert` and `Badge` components wherever possible to reduce custom CSS.
