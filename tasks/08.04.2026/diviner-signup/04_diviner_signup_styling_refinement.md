# Diviner Signup Styling and Responsive Design

- Status: Pending
- Completion Notes:

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
