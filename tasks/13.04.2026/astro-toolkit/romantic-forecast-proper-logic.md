# Romantic Forecast Report (Tropical V2) Logic & Styling

This document outlines the specific logic, prompt keys, and visual styling for the `romantic_forecast_report_tropical_v2` route in the Horoscope Toolkit.

## 1. Section Logic & Prompts

The following table details the AI prompt logic for each section in the relationship report dashboard.

| Section Name | Prompt Key | Logic / Description |
| :--- | :--- | :--- |
| **Synastry Horoscope** | `synastry_horoscope` | Compares the planet positions of Partner A against Partner B to determine attraction and friction points. |
| **Composite Horoscope** | `composite_horoscope` | Generates a midpoint chart representing the relationship itself as a third entity. |
| **Davison Relationship** | `davison_relationship` | Calculates the midpoint in time and location between both partners' births to create a unique relationship chart. |
| **Major Aspects and Connections** | `major_aspects_and_connections` | Analyzes key planetary interactions (conjunctions, trines, etc.) between partners. |
| **Compatibility Score or Summary** | `compatibility_score_or_summary` | Provides a weighted summary of the relationship potential and a final recommendation. |
| **Elemental Balance** | `elemental_balance` | Analyzes the distribution of Fire, Earth, Air, and Water between both charts for overall harmony. |
| **Timing and Transits** | `timing_and_transits` | Investigates current and upcoming transits affecting the relationship's timeline. |
| **Karmic and Soulmate Indicators** | `karmic_and_soulmate_indicators` | Specifically analyzes Chiron and the Lunar Nodes for past-life connections and soul purposes. |

---

## 2. Visual Styling & Color Logic

All relationship sections follow a consistent premium "Gold & Paper" aesthetic to ensure high readability and a luxurious feel.

### A. Section Containers
- **Main Section Header**: Use `.horoscope-section-header`
    - **Background**: `#232528` (Rich Off-Black)
    - **Text Color**: `#f1f1f1` (Off-White)
    - **Font Size**: 20px (SmartHeading)

### B. Interpretation Items
Each individual interpretation within a section follows this color scheme:

| Component | Class / Style | Value / Property |
| :--- | :--- | :--- |
| **Item Header** | `.horoscope-interp-header` | **Background**: `#ffffff` (Pure White) |
| **Header Text** | — | **Color**: `#232c3c` (Dark Charcoal), 22px, Bold, Uppercase |
| **Content Area** | `.interp-gradient-default` | **Background**: `linear-gradient(166deg, #f0a023 0%, #f8d647 100%)` |
| **Content Text** | — | **Color**: `#000000` (Black), 20px, Roboto Font |

### C. Interactive Elements
- **"Show More" Button**:
    - **Gradient**: `linear-gradient(to bottom, #5c5c5c, #000000)`
    - **Text**: White with subtle text-shadow.
    - **Radius**: `5px`
- **Decan Icon**:
    - **Background**: `rgba(245, 158, 11, 0.15)` (Amber glow)
    - **Border**: `rgba(245, 158, 11, 0.5)`

---

## 3. Data Flow Overview

1. **Input**: Partner A and Partner B birth data (DOB, TOB, Lat/Lon, Tzone).
2. **Tab Selection**: `romantic_forecast_report_tropical_v2`.
3. **API Call**: Fetches synastry and composite data from the astrology engine.
4. **AI Generation**: `buildAiPrompts` constructs 8 unique prompts for the sections above.
5. **Rendering**: `RelationshipSection.tsx` maps the AI responses to the styled layouts defined in `globals.css` and `horoscope-tables.css`.
