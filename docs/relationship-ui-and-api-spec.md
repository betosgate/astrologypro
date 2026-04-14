# Relationship UI and API Specification

This document provides the technical details required to replicate the **Show More Modal** and **Relationship Interpretation Sections** (Background/Color logic) in another project.

## 1. Section Background & Color Logic

The UI uses dynamic background gradients and text colors for interpretation blocks based on the planet or section type being discussed.

### Logic (getBgClass)
In the frontend code (e.g., `RelationshipSection.tsx`), a helper function `getBgClass` determines the CSS class based on keywords in the interpretation title:

```typescript
const getBgClass = (itemTitle: string) => {
  const lower = itemTitle.toLowerCase();

  // 1. Planet-specific detection (Highest Priority)
  if (lower.includes("sun")) return "planet-interp-sun";
  if (lower.includes("moon")) return "planet-interp-moon";
  if (lower.includes("mercury")) return "planet-interp-mercury";
  if (lower.includes("venus")) return "planet-interp-venus";
  if (lower.includes("mars")) return "planet-interp-mars";
  if (lower.includes("jupiter")) return "planet-interp-jupiter";
  if (lower.includes("saturn")) return "planet-interp-saturn";
  if (lower.includes("uranus")) return "planet-interp-uranus";
  if (lower.includes("neptune")) return "planet-interp-neptune";
  if (lower.includes("pluto")) return "planet-interp-pluto";

  // Karmic bodies
  if (lower.includes("node") || lower.includes("chiron")) return "section-karmic-indicators";

  // 2. Elemental fallback
  if (lower.includes("fire")) return "planet-interp-mars";
  if (lower.includes("water")) return "planet-interp-neptune";
  if (lower.includes("air")) return "planet-interp-mercury";
  if (lower.includes("earth")) return "planet-interp-venus";

  // 3. Section fallback
  if (sectionKey === "timing_and_transits") return "section-timing-transits";
  if (sectionKey === "karmic_and_soulmate_indicators") return "section-karmic-indicators";

  return "interp-gradient-default";
};
```

### CSS Tokens (Gradients & Text Colors)
The following CSS provides the "Gold & Paper" aesthetic with accessible text contrast for each background:

| Class | Background Gradient | Text Color |
| :--- | :--- | :--- |
| `.planet-interp-sun` | Yellow/Orange | Black (`#000`) |
| `.planet-interp-moon` | Grey/Silver | Black (`#000`) |
| `.planet-interp-mercury` | Yellow/Gold | Black (`#000`) |
| `.planet-interp-venus` | Green/Lime | Black (`#000`) |
| `.planet-interp-mars` | Red/Brick | **White** (`#fff`) |
| `.planet-interp-jupiter` | Blue/Sky | **White** (`#fff`) |
| `.planet-interp-saturn` | Black/Dark Grey | **White** (`#fff`) |
| `.planet-interp-uranus` | Cyan/Teal | Black (`#000`) |
| `.planet-interp-neptune` | Dark Blue | **White** (`#fff`) |
| `.planet-interp-pluto` | Deep Red | **White** (`#fff`) |
| `.interp-gradient-default` | Golden/Orange | Black (`#000`) |

---

## 2. Show More Modal Implementation

The "Show More" functionality is triggered when a user clicks the button at the bottom of an interpretation block.

### Component Structure
The `ShowMoreModal` uses a Dialog (Radix/Shadcn) and handles two types of content:
1.  **AI Interpretation**: Detailed text retrieved via the AI API.
2.  **Pictorial Analysis**: A relevant astrological image retrieved via the Picture API.

### State Management (useShowMore Hook)
The hook manages the modal state and the two parallel API calls (`ai-interpret` and `astro-picture-content`).

```typescript
async function trigger(title, currentText, promptData, areaOfInquiry, aspectTitle, promptType) {
  // 1. Set loading state
  // 2. Fetch Picture Content (Async)
  const picturePromise = fetchPicture(resolvedType, aspectTitle ?? title, promptData);

  // 3. Fetch AI Interpretation (Async)
  const [aiResult, pictureResult] = await Promise.all([
    fetchAiInterpretation(promptData, areaOfInquiry, resolvedType),
    picturePromise
  ]);

  // 4. Update Modal with results
}
```

---

## 3. API & Payload Details

### A. AI Interpretation API
**Endpoint**: `/api/admin/astro/ai-interpret`
**Method**: `POST`

**Payload Structure**:
```json
{
  "aiPayload": {
    "condition": {
      "system_content": "Instruction for the AI to act as an astrologer and return JSON.",
      "user_content": "Specific request for details on aspects/planets/houses with sentence constraints (e.g. min 8 sentences)."
    },
    "toolname": "other",
    "json": [ { "data": "astrological_source_data" } ]
  },
  "areaOfInquiry": "friendship | career | love"
}
```

### B. Picture Content API
**Endpoint**: `/api/admin/astro/astro-picture-content`
**Method**: `POST`

The payload requires a `filename` and `foldername` which are dynamically constructed based on the astrological context:

*   **Aspects**:
    *   Folder: `aspect`
    *   Filename: `Sun-Trine-Mars` (Capitalized-Hyphenated)
*   **Planets**:
    *   Folder: `planets`
    *   Filename: `Sun-In-Aries` (Planet-In-Sign)
*   **Houses**:
    *   Folder: `house`
    *   Filename: `Aries-In-1st-House` (Sign-In-Ordinal-House)

---

## 4. Specific Payload Logic (Relationship Reports)

For Synastry, Composite, and Davison reports, the `build-ai-prompts.ts` utility constructs complex prompts:

1.  **System Prompt**: Injects a persona of a professional Western astrologer with specific instructions for chart overlays and house systems.
2.  **User Prompt**:
    *   Includes birth data for both partners.
    *   Injects the `areaOfInquiry`.
    *   Requests a specific JSON format: `{ data: [ { title: "...", data: "..." } ] }`.
    *   Enforces length constraints (e.g., "at least 5 sentences with astrological logic").

### Example Davison Prompt Fragment:
> "Analyze the 'relationship soul' ... Provide a deeply personalized response ... Area of Inquiry: ${areaOfInquiry}. ... Response format must be exact: { data: [{ title: data }] }"
