# Relationship Charts Analysis

## How Pairs are Created
In the `community/charts` route (specifically in `src/app/community/charts/page.tsx`), pairs are generated dynamically from the list of family members fetched from the database.

The code uses a nested loop to create every unique combination of two family members:

```typescript
// src/app/community/charts/page.tsx lines 209-214
const pairs: { a: FamilyMember; b: FamilyMember }[] = [];
for (let i = 0; i < familyMembers.length; i++) {
  for (let j = i + 1; j < familyMembers.length; j++) {
    pairs.push({ a: familyMembers[i], b: familyMembers[j] });
  }
}
```

This ensures that for any set of family members (e.g., A, B, C), the system generates pairs (A, B), (A, C), and (B, C).

---

## Why UI Differences Exist Between Pairs

You noticed that some pairs have **stars** and an **extra whole section drop-down menu**, while others do not. This is driven by the presence of `synastry` data (legacy or pre-calculated chart data).

### 1. The "Stars" (Compatibility Score)
Stars are only rendered if the API returns a pre-existing chart for that specific pair.
- **Logic:** `synastry && (...)`
- **Source:** The `score` property within the `chart_data` object.
- **Calculation:** `i < Math.round(synastry.score / 20)` (converts a 0-100 score to a 5-star rating).

### 2. The "Extra Whole Section" (Expanded View)
The ability to "expand" a card to see an extra section is also gated by the presence of `synastry` data.

```typescript
// src/app/community/charts/page.tsx line 383
{isOpen && synastry && (
  <CardContent className="border-t pt-4 space-y-5">
    {/* ... Extra Section Content ... */}
  </CardContent>
)}
```

### Summary of Differences

| Feature | Pair WITH Synastry Data | Pair WITHOUT Synastry Data |
| :--- | :--- | :--- |
| **Stars** | Visible (based on `synastry.score`) | Hidden |
| **Subtitle** | Shows aspect counts (Harmonious/Challenging) | Shows "Choose a relationship type..." |
| **Expandable** | Yes (Clicking the card opens the section) | No (Card is not interactive) |
| **Extra Section** | Contains "Open full diviner-style report" CTA | Not available |

**Why is it like this?**
The "extra section" and stars rely on data stored in the `relationship_charts` table. If a pair has never had a chart generated (even a legacy one), this data is `undefined`, and the UI reverts to a simplified "Generation" state where the user must first select a relationship type (Romantic, Friendship, or Business) to proceed to the detailed toolkit.
