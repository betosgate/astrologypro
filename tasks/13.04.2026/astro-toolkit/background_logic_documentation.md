# Romantic Forecast (Tropical V2) - Body Background Logic

This document details the logic and implementation for the dynamic body backgrounds in the `admin/horoscope` route when the selected tab is `romantic_forecast_report_tropical_v2`.

## 1. Context Detection
The styling logic is triggered when the `toolname` or `tab` matches:
- `romantic_forecast_report_tropical_v2`
- `friendship_report_tropical_v2` (Friendship Relationship)

## 2. Header Specification
Following the latest design request, all headers in this route follow a unified "Paper & Ink" aesthetic:
- **Background**: `#ffffff` (White)
- **Text Color**: `#000000` (Black)
- **Borders**: Subtle `rgba(0,0,0,0.1)` for structural separation.

---

## 3. Section Body Background Logic
The background of each interpretation block's content area (the "Body") is determined by a mapping function (`getBgClass`) in `RelationshipSection.tsx`.

### A. Dynamic Keyword Mapping
The system scans the section title for specific keywords to assign a themed gradient:

| Keyword | Gradient Theme | Associated Symbolism |
| :--- | :--- | :--- |
| **Fire** | `.fire-gradient` | Energy, Passion, Vitality |
| **Water** | `.water-gradient` | Emotion, Intuition, Depth |
| **Air** | `.air-gradient` | Communication, Intellect |
| **Earth** | `.earth-gradient` | Stability, Grounding |

### B. Planet-Specific Gradients
If the interpretation is based on a specific planet (e.g., in Synastry or Davison sections), the background reflects that planet's traditional color:

| Planet | Gradient CSS Class | Primary Color | Text Color |
| :--- | :--- | :--- | :--- |
| **Sun** | `.planet-interp-sun` | Gold/Yellow | Black |
| **Moon** | `.planet-interp-moon` | Silver/Grey | Black |
| **Mercury** | `.planet-interp-mercury` | Bright Yellow | Black |
| **Venus** | `.planet-interp-venus` | Green | Black |
| **Mars** | `.planet-interp-mars` | Red | **White** |
| **Jupiter** | `.planet-interp-jupiter` | Blue | **White** |
| **Saturn** | `.planet-interp-saturn` | Black/Dark Grey | **White** |
| **Uranus** | `.planet-interp-uranus` | Cyan/Sky Blue | Black |
| **Neptune** | `.planet-interp-neptune` | Dark Blue | **White** |
| **Pluto** | `.planet-interp-pluto` | Deep Red | **White** |

### C. Thematic Section Gradients
Sections that represent abstract timings or karmic indicators use specific atmospheric gradients:

| Section Name | CSS Class | Gradient Theme | Text Color | Rationale & Symbolism |
| :--- | :--- | :--- | :--- | :--- |
| **Timing & Transits** | `.section-timing-transits` | Cosmic Indigo (`#00008B`) | **White** | Represents the vastness of the cosmos and the unfolding of time. Blue conveys the reflective, ethereal nature of celestial transits. |
| **Karmic Indicators** | `.section-karmic-indicators` | Deep Crimson (`#8B0000`) | **White** | Symbolizes soul-level intensity, passion, and evolutionary depth. Crimson reflects the "blood of the soul" and Pluto-like transformation. |
| **Other / Default** | `.interp-gradient-default` | Golden Orange | Black | Reflects the standard warmth and solar vitality of a personal horoscope. |

---

## 4. Legibility & Accessibility Rules
The text color within these background gradients is governed by the following rule:
- **Light Gradients (Sun, Mercury, Venus, etc.)**: Body text is **Black** (`#000000`).
- **Dark Gradients (Mars, Jupiter, Saturn, etc.)**: Body text is **White** (`#ffffff`).

*This is enforced via `!important` declarations in `globals.css` to ensure consistency across all components and viewports.*
