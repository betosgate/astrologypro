# Romantic Forecast Report (V2) - Logic and Visual Specifications

This document defines the functional and visual logic for the `romantic_forecast_report_tropical_v2` route. Use this as the master blueprint for porting or recreating this feature in any project.

## 1. Section Definitions & Functional Logic

Each section in the Romantic Forecast dashboard is driven by a unique AI prompt key.

| # | Section Name | Prompt Key | Data Logic |
| :--- | :--- | :--- | :--- |
| 1 | **Synastry Horoscope** | `synastry_horoscope` | Compares Partner A's planets to Partner B's houses/aspects. |
| 2 | **Composite Horoscope** | `composite_horoscope` | Midpoint chart representing the relationship "soul." |
| 3 | **Davison Relationship** | `davison_relationship` | Midpoint in time and space relationship chart. |
| 4 | **Major Aspects and Connections** | `major_aspects_and_connections` | Key interpersonal planetary interactions. |
| 5 | **Compatibility Score or Summary** | `compatibility_score_or_summary` | Overall relationship grade and recommendation. |
| 6 | **Elemental Balance** | `elemental_balance` | Fire, Earth, Air, Water distribution analysis. |
| 7 | **Timing and Transits** | `timing_and_transits` | Impact of current/future planetary movements on the couple. |
| 8 | **Karmic and Soulmate Indicators** | `karmic_and_soulmate_indicators` | Deep soul purpose, North/South Nodes, and Chiron analysis. |

---

## 2. Visual & Color Logic (The "Premium Aesthetic")

The visual style follows a "Dynamic Color" logic. Colors are not static; they change based on the **Planet** or **Astrological Theme** being discussed to increase scannability and "WOW" factor.

### A. The "Golden" Default
Used for summaries and general headers to maintain a premium feel.
- **Header Background**: `#232528` (Rich Off-Black)
- **Content Background**: `linear-gradient(166deg, #f0a023 0%, #f8d647 100%)` (Golden Yellow)

### B. Section-Specific Color Assignment

| Section | Color Assignment Logic | Example Color |
| :--- | :--- | :--- |
| **Synastry Horoscope** | **Dynamic (by Planet)** | Red for Mars, Blue for Jupiter, etc. |
| **Composite Horoscope** | **Golden Gradient** | Standard Gold Theme. |
| **Davison Relationship** | **Golden Gradient** | Standard Gold Theme. |
| **Major Aspects** | **Dynamic (by First Planet)** | "Moon Sextile..." = Grey/Silver Block. |
| **Compatibility Summary**| **Golden Gradient** | Highlighted Golden Theme. |
| **Elemental Balance** | **Dynamic (by Element)** | Fires = Red/Orange; Waters = Blue. |
| **Timing & Transits** | **Cosmic Indigo** | Deep Blue Gradient (`#00008B` to `#4169E1`). |
| **Karmic Indicators** | **Mystic Purple** | Deep Purple Gradient (`#8B0000` to `#CD5C5C`). |

---

## 3. Technical Logic for Developers (Pseudo-code)

To implement the different colors automatically as seen in the screenshot, use this logic:

### 1. The Color Map (CSS)
Define gradients for each planet in your global CSS (e.g., `.planet-red`, `.planet-green`, etc.).

### 2. The Title Parser
Write a function to extract the primary planet from a title string.
```javascript
function getPrimaryPlanet(title) {
  // If title is "Moon Trine Venus", returns "Moon"
  return title.split(" ")[0].toLowerCase();
}
```

### 3. Dynamic Section Rendering
In your loop where you render interpretation blocks, set the class dynamically.
```tsx
const planet = getPrimaryPlanet(item.title);
const bgClass = planetClasses[planet] || "interp-gradient-default";

return (
  <div className={`interpretation-block ${bgClass}`}>
    <h3>{item.title}</h3>
    <p>{item.interpretation}</p>
  </div>
);
```

### 4. Styling Constants
- **Header Text**: White (`#ffffff`), 22px, Bold.
- **Body Text**: Black (`#000000`), 20px, Roboto.
- **Show More Button**: Black Gradient with White Text.
