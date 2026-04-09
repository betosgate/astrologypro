# Walkthrough: Tropical Transits Monthly v3 (Monthly Transits + Lunar Return)

This document provides a detailed technical walkthrough of the `horoscope?tab=tropical_transits_monthly_v3` route. It outlines the components, sections, and API integrations required to replicate the page functionality.

---

## 1. Route Overview
- **Slug**: `tropical_transits_monthly_v3`
- **Label**: Monthly Transits + Lunar Return
- **Description**: Combines monthly transit data with lunar return data and AI interpretation.

---

## 2. Page Structure (Sections & Components)

The page is built using a vertical stack of sections. Each section focuses on a specific data type.

### A. Header & Input Section
- **Components**: `TabBar`, `BirthBlock`, `Input (type="month")`, `Textarea (Area of Inquiry)`
- **Sections**:
    1. **Tab Identity**: Displays "Monthly Transits + Lunar Return".
    2. **Birth Form**: Collected inputs for DOB, TOB, and City.
    3. **Future Month Picker**: Allows selecting a specific month for the report.

### B. Visualization Section (Natal Charts)
- **Component**: `NatalChartsRow`
- **Sections**:
    1. **Natal Wheel Chart**: Standard tropical wheel fetched from AstrologyAPI.
    2. **Free Natal Wheel**: Alternative visualization fetched from decan internal API.

### C. Transit Aspects Section (Technical Data)
- **Component**: `TransitSection` (Table View)
- **Sections**:
    1. **Transit Table**: Displays columns for Transit Planet, Aspect, Natal Planet, Orb, and Date.

### D. Lunar Return Metrics Section (Technical Data)
- **Component**: `TransitSection` (Lunar Metrics View)
- **Sections**:
    1. **Lunar Table**: Displays Moon Day, Moon Illumination, Moon Phase, and Moon Sign.

### E. AI Interpretations Section (Core Content)
- **Component**: `TransitSection` (AI Narrative Part)
- **Sections**:
    1. **Monthly Transit Interpretations**: Individual cards for each major transit with "Show More" functionality.
    2. **Lunar Return AI Interpretation**: Narrative breakdown of the Moon's cycle for that period.

### F. Natal Details Section (Reference Data)
- **Components**: `PlanetsSection`, `HousesSection`, `DharmaKarmaSection`, `AspectsSection`
- **Purpose**: Full natal analysis remains visible at the bottom for comprehensive understanding.

---

## 3. API Workflow & Rationale

| Context | API Name / URL | Payload Structure | Rationale |
| :--- | :--- | :--- | :--- |
| **Natal Base** | `western_horoscope` | `{day, month, year, hour, min, lat, lon, tzone}` | Foundation data for the entire page. |
| **Monthly Transits** | `tropical_transits/monthly` | `{day, month, year, hour, min, lat, lon, tzone}` | Returns all transits occurring in the "Current Month". |
| **Lunar Return** | `lunar_metrics` | `{day, month, year, hour, min, lat, lon, tzone}` | Returns lunar phase and illumination for the "Current Month". |
| **Future Report** | `astrology_report_monthly` | `{"steps":"astrology_report_monthly", "birth_details":{...}, "target_year", "target_month"}` | **Critical**: Combines transits and lunar data into one payload for future months. |
| **AI Interpretations** | `ai-interpret` | `{"condition": {"system_content", "user_content"}, "json": [...] }` | Converts raw technical data (JSON) into astrological interpretations. |
| **Wheel Charts** | `natal_wheel_chart` | `{day, month, year ...}` | Generates the SVG wheel for the natal chart. |
| **Save Results** | `save-astro-AI-Response` | `{"toolname": "tropical_transits_monthly_v3", "ai_response": {...}}` | Persists the generated content to avoid repeated AI costs. |

---

## 4. How to Implement (Detailed Discussion)

### 1. Unified Fetch Strategy
In `page.tsx`, the logic checks for `form.futureMonth`. 
- If **selected**, it calls the single Lambda endpoint (`astrology_report_monthly`) which has been optimized to return all necessary transit and lunar data for future dates.
- If **not selected**, it defaults to current Month and calls AstrologyAPI's `tropical_transits/monthly` and `lunar_metrics` in parallel.

### 2. Dual AI Prompting
The `buildAiPrompts` function generates two distinct prompts for this tab:
- **`tropical_transits_monthly`**: Focuses on the planetary relationships. It requests a specific JSON format: `[{aspecttitle: string, interpretation: string}]`.
- **`lunar_metrics`**: Focuses on the Moon's cycle. It requests interpretation for Moon sign, phase, and age.

### 3. Progressive Rendering
The page updates the `results` state as each API returns. This prevents the user from seeing a blank screen while the AI is processing.
- Technical tables (Transits, Lunar Metrics) show up first.
- AI cards show "Cosmic Retrieval..." skeletons until `ai_interpretations` are populated.

### 4. Interactive "Show More"
Each AI interpretation is hooked into `useShowMore()`. When triggered, it:
1.  Displays the full text.
2.  Fetches a **Pictorial Representation** from S3 if available (e.g., "Mars-Square-Pluto.svg").
3.  Shows **Keyword Association Chips** (e.g., Mars: action, drive; Pluto: transformation).

---

## 5. Summary of API List Usage

- **`monthly`**: Populates the "Transit Aspects" table.
- **`Future Lunar Metrics` (AI Prompt)**: Populates the "Lunar Return AI Interpretation" cards.
- **`Future Tropical Transits Monthly Relation` (AI Prompt)**: Populates the "Monthly Transit Interpretation" cards.
- **`astrology_report_monthly`**: The data source for both tables when a future date is picked.
- **`natal_wheel_chart`**: Populates the visualization at the top.
- **`save-astro-AI-Response`**: Called at the end of the `handleSubmit` process to cache the entire generated report.
