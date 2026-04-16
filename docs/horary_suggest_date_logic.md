# Horary "Suggest Another Date" Logic Documentation

This document outlines the technical implementation of the "Suggest Another Date" (or Date Recreation) functionality within the `horary_chart_v2` tab. This feature allows users to request alternative auspicious timelines directly from the rendered AI interpretation.

## 1. Iconography & Visuals
*   **Icon Name:** `event_repeat`
*   **Source:** Material Icons font-family.
*   **Icon Library:** [Material Design Icons](https://fonts.google.com/icons).
*   **Visual Style:** A calendar icon with a circular arrow, standardizing the "refresh/repeat" action for dates.
*   **CSS Class:** `.timedata-btn` (defined in `horoscope-tables.css`).

## 2. UI Injection Logic (DOM Manipulation)
Because the AI-generated interpretation contains dynamic HTML with a specialized class `<span class="timedata">`, standard Angular/React click handlers cannot be bound at render time.

### MutationObserver Mechanism
The system uses a **`MutationObserver`** to dynamically detect and patch the UI:
1.  **Observation:** The component monitors the `document.body` for any changes to the DOM tree.
2.  **Detection:** When new `.timedata` spans are rendered (from the AI response), the `patchTimeSpans()` function is triggered.
3.  **Injection:** 
    *   It verifies the span hasn't been processed using a `data-timebutton` flag.
    *   It creates a `<button>` element with the `timedata-btn` class.
    *   It appends the `event_repeat` icon into the button.
    *   The button is injected directly into the `.timedata` span, adjacent to the date text.

## 3. Interaction & Data Flow
When a user clicks the suggest/recreate button:

1.  **Date Extraction:** The code clones the span, removes the button itself, and extracts the raw text content (e.g., *"January 10th - February 15th, 2025"*).
2.  **Exclusion State:** This extracted date is stored in a state variable (e.g., `suggestMoreDays`).
3.  **Prompt Re-generation:** A fresh API call is triggered for the `horary_chart_question`.
4.  **Exclusion Injection:** The UI logic appends a strict exclusion rule to the AI prompt:
    > *"Rule 7: You MUST AVOID recommending the following dates or date ranges entirely: ${this.suggestMoreDays}. All of your suggested timelines must fall outside of these exclusion periods."*

## 4. AI Prompt Engineering Rules
The "Intelligence" of the date suggestion relies on specific instructions in the system prompt:

| Rule Name | Instruction to AI |
| :--- | :--- |
| **Excluded Dates** | Must strictly avoid previous recommendations stored in the exclusion variable. |
| **Flexible Timeline Search** | If the initial range is auspicious but blocked, or if a better alignment exists nearby, the AI is permitted to suggest an alternative within 30 days of the requested range. |
| **Future Justification** | Every suggested alternative must include a detailed astrological justification (transits to natal planets) explaining why it is superior or why the previous was rejected. |
| **Date Formatting** | All new suggestions must be wrapped in `<span class="timedata">` to allow for recursive "recreations." |

## 5. File Locations
*   **Angular Implementation:** `/src/app/horosceop/components/horary-chart-v2/horary-chart-v2.component.ts`
*   **Next.js Implementation:** `/src/app/admin/horoscope/page.tsx`
*   **Prompt Logic:** `/src/app/admin/horoscope/build-ai-prompts.ts`
*   **Styles:** `/src/app/admin/horoscope/horoscope-tables.css` (Look for `.timedata-btn` and `.timedata`).
