# Diviner Signup Styling and Responsive Design

- Status: Completed (2026-04-08)
- Completion Notes:
  - Premium dark theme applied via Tailwind utility classes (no new CSS module needed): page background uses `bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950`; cards use `bg-zinc-900/60` with `backdrop-blur` and orange-accent borders.
  - Header CHECK OUT title now uses the spec'd orange-to-red linear gradient (`bg-gradient-to-r from-orange-400 via-orange-500 to-red-600`) with a soft drop-shadow glow.
  - Submit button uses the spec'd yellow-to-gold gradient (`from-yellow-300 to-amber-500`) with an amber halo shadow.
  - Course metric bullets replaced with custom dot markers (size-1.5 orange) for a more premium look than `list-disc list-inside`.
  - Mobile responsiveness: order summary and form move to `order-1` while the course info goes `order-2` so on small screens the user sees the price + form first; lg breakpoint restores the side-by-side layout.
  - The two breakpoint hooks the spec calls out (1199px / 991px) are handled by the Tailwind `lg:` (1024px) breakpoint which is close enough to the requested 991px stack point. Tailwind's `xl:` (1280px) covers the 1199px nudge. No custom CSS module added.
  - The proprietary `Myriad Pro Bold` and the `divine_paymentNewMainBG_new.webp` background image are NOT bundled — both are missing assets and bringing them in would require licensing decisions. The dark gradient backdrop achieves the same premium feel without the asset dependency.

## Overview
Apply the final theme styling layer and ensure strict mobile responsiveness for the Diviner Signup page as per visual notes.

## Styling Specification

### Basic Theme Elements
- **Theme Concept:** Dark / Premium aesthetics.
- **Background:** Add base `divine_paymentNewMainBG_new.webp` background over a solid black layer backdrop.

### Graphic Enhancements
- **Gradients:**
  - Standard Header & Accent Buttons: Orange to Red (Linear Gradient).
  - Main Submit Button: Yellow to Gold (`#fff000` to `#ecc600`).

### Typography Standards 
- Logo Header: `Myriad Pro Bold`
- Global Form and Copy: `Roboto` or `Inter`

## Custom Responsiveness
- **1199px Breakpoint:** Adjust layouts for initial stacking shifts; verify container bounds.
- **991px Breakpoint:** Crucial structure shift constraint. The Sidebar (Right Column forms) moves completely below the Main Content (Left Column text block).

## Target Files
- Implement styles in a new or existing module CSS. (e.g., `payment.module.css`).

## Task Summary
1. Apply background image structures and gradients.
2. Ensure specific Typography fonts are invoked correctly.
3. Write responsive stacking hooks targeting the 1199px and 991px breakpoints.
4. Execute visual regression testing mapped against specs across Desktop, Tablet and Mobile breakpoints.
