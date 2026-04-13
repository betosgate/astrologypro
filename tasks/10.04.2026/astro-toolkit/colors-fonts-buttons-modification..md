# Horoscope Route Color Theory & Usage

This document explains the color usage and theory in the `/admin/horoscope` (Horoscope Toolkit) route of the application. The design follows a professional yet "mystical" aesthetic, prioritizing readability for technical data and a premium feel for interpretations.

## 1. Global Layout & Structural Colors

| Section | Color Code / Variable | Description |
| :--- | :--- | :--- |
| **Header (Subwrapper)** | `var(--orange-gradient)` | The main top bar background. |
| **Top Header** | `#1d1f23` | Dark charcoal background for the very top utility bar (Logout/User menu). |
| **Main Body Background** | `#0a0c10` | Deep black background used for the overall container, especially in shared views. |
| **Left Sidebar (Navigation)** | `#272f3c` | Dark slate blue background for the navigation menu. |
| **Sidebar Text** | `#d7dce5` | Light gray-blue text for menu items. |
| **Sidebar Hover** | `#435066` | Medium slate blue for hover states. |
| **Sidebar Active** | `#6c798f` | Steel blue background with **Black** (`#000000`) text to highlight the selected tool. |

## 2. Result Sections (Planet, House, Aspects)

The results are divided into technical data (tables) and descriptive interpretations.

### A. Section Headers
*   **Background:** `#232528` (Rich Off-Black)
*   **Text Color:** `#f1f1f1` (Off-White)
*   **Border:** `1px solid rgba(182, 199, 227, 0.17)`
*   **Purpose:** To clearly separate the different parts of the horoscope (e.g., Planet Info vs. House Info).

### B. Technical Data Tables
*   **Table Header (`thead`):** `background: #1e242f` (Dark Blue-Gray) with White text.
*   **Table Body:** `background: #ffffff` (Pure White) with Black borders (`1px solid black`).
*   **Purpose:** The high contrast between white background and black text ensures that degrees and signs are easily readable.

### C. Interpretation Blocks (Descriptions)
This is where the "Theory" of the site comes to life, using a warmer palette for the content.
*   **Header:** White background (`#ffffff`) with Dark Blue-Gray text (`#232c3c`).
*   **Content Background:** `linear-gradient(166deg, #f0a023 0%, #f8d647 100%)`
    *   **Theory:** A **Golden-Orange Gradient** is used for all interpretation text. This symbolizes enlightenment, gold/divine wisdom, and provides a warmth that contrasts with the technical "cold" feeling of the tables.
*   **Content Text Color:** Black for maximum legibility over the bright gradient.

## 3. Planet-Specific Interpretation Colors

In the "Planet Information" section, the interpretation blocks dynamically change their background gradient and text color based on the specific planet. This is achieved through a combination of dynamic component classes and global CSS overrides.

### Implementation Logic
1.  **Dynamic Class Generation:** The `CommonTabilLilithComponent` uses a helper function `createClass(aspect.name)` which converts planet names (e.g., "Sun", "Moon") into lowercase, hyphenated CSS classes (e.g., `sun`, `moon`).
2.  **Parent Scoping:** This class is applied to the wrapper `div` (`.contetnt_block_Wraper`).
3.  **Global Styling:** The `src/assets/style.css` file contains specific rules that target these classes to apply unique gradients and text colors to the `.containt_text_planet_containt` element.

### Color Palette Reference

| Planet | Background Gradient (Start → End) | Text Color | Symbolism |
| :--- | :--- | :--- | :--- |
| **Sun** | `rgba(240, 160, 35, 1)` (Gold) → `rgba(248, 214, 71, 1)` | Black | Vitality & Ego |
| **Moon** | `#8c8c8c` (Silver) → `#C0C0C0` | Black | Emotions & Subconscious |
| **Mercury** | `#FFFF00` (Yellow) → `#FFD700` | Black | Communication & Intellect |
| **Venus** | `#00FF00` (Green) → `#32CD32` | Black | Love & Harmony |
| **Mars** | `#FF0000` (Red) → `#B22222` | **White** | Action & Desire |
| **Jupiter** | `#0000FF` (Blue) → `#1E90FF` | **White** | Wisdom & Expansion |
| **Saturn** | `#000000` (Black) → `#4B4B4B` | **White** | Discipline & Karma |
| **Uranus** | `#00FFFF` (Cyan) → `#008B8B` | Black | Innovation & Change |
| **Neptune** | `#00008B` (Dark Blue) → `#4169E1` | **White** | Dreams & Illusion |
| **Pluto** | `#8B0000` (Dark Red) → `#CD5C5C` | **White** | Power & Transformation |

## 4. Typography (Fonts & Weights)

The application uses **Roboto** as the primary font family for a clean, modern, and readable technical interface.

| Element | Font Family | Size | Weight | Line Height |
| :--- | :--- | :--- | :--- | :--- |
| **Section Header (H1)** | `Roboto, sans-serif` | `40px` | `600` | `32px` |
| **Table Headers (TH)** | `Roboto, sans-serif` | `20px` | `600` | `26px` |
| **Interpretation Text** | `Roboto, sans-serif` | `20px` | `400` | `26px` |
| **Sidebar Menu Items** | `Roboto, sans-serif` | `18px` | `400` | `Normal` |
| **Sub-titles (H2)** | `Roboto, sans-serif` | `2.4rem` | `700` | `Normal` |

---

## 5. Visual Elements & Component Styling

### A. Header Icons
Each interpretation block header contains specific visual cues to identify the astrological body:
*   **Primary Icon:** A 30px colorful planetary symbol injected via the `astroHeaderImage` pipe, displayed next to the planet name.
*   **Decan Trigger:** A special gold-themed icon (hosted on S3) that appears only if Decan information is available for that specific placement. It serves as a clickable trigger for the Decan modal.
*   **Header Alignment:** Icons and text are centered using `flex` with a `20px` gap for a premium, symmetrical look.

### B. "Show More" Button Styling
The "Show More" buttons within interpretation blocks are designed to be subtle yet accessible, ensuring they don't distract from the main text.

*   **Background:** `linear-gradient(#5c5c5c, #000000)` (Deep Gray to Black).
*   **Typography:** White text with a subtle warm text-shadow (`1px 1px 1px #874403`).
*   **Border:** `1px solid #e6e6e6` for crisp definition.
*   **Shape:** `5px` border-radius with generous padding (`1.2rem 2.5rem`) for a tactile, "button" feel.
*   **Hover Effect:** Includes a box-shadow (`0 4px 6px rgba(0, 0, 0, 0.1)`) to provide depth.

### C. UI Accents Refresher

| Element | Color / Gradient | Usage |
| :--- | :--- | :--- |
| **Bookmark Icon** | `#ff9c00` (Orange) | Indicates saved sections in the sidebar. |
| **Secondary Buttons** | `linear-gradient(#5c5c5c, #000000)` | Used for "Scroll to Top" and "Show More". |
| **Scrollbars** | Thumb: `#384355`, Track: `#0a0c10` | Custom themed for the navigation container. |

---

## 6. Summary of Theory
The color and typography scheme transitions from **Deep Dark Space** (structural elements) to **Technical White** (data tables) and finally to **Divine Gold** (interpretations). The use of large, bold fonts for headers contrasted with clear, standard-weight text for data ensures a balanced user experience that feels both technical and transcendental.
