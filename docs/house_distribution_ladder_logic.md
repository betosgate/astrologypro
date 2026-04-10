# House Distribution Ladder Presentation Logic

This document details the implementation of the "Ladder Type" presentation (also known as the "House Distribution Grid") found in the **House Information** section of the `/horoscope` route. This presentation provides a visual "track" for planets across the 12 houses.

## 1. Overview
The ladder presentation is a grid-based visualization where:
- **Rows** represent the 12 Astrological Houses.
- **Columns** represent specific Planets in a fixed order.
- **Visuals**: If a planet resides in a house, its icon is displayed at its corresponding column. Any columns to the left of the "furthest" planet in that house are filled with dark blocks, creating a "ladder" or "staircase" effect.

## 2. Core Data Requirements
To replicate this in another project, you need the following data structures:

### A. Planet Ordering
Define a fixed sequence of planets which dictates the column order.
```typescript
const PLANET_ORDER = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", 
  "Saturn", "Jupiter", "Uranus", "Neptune", 
  "Pluto", "Node", "Part of Fortune", "Chiron"
];
```

### B. Input Data
1.  **Houses Array**: A list of 12 house objects.
    - Each house must have: `house` (number), `sign` (string), and `degree` (number).
2.  **Planets Array**: A list of planet objects.
    - Each planet must have: `name` (string), `house` (the house number it resides in), and optional details like `full_degree` and `is_retro`.

## 3. Implementation Logic

### Step 1: Map Planets to Houses
Group the planet data by house number for easy lookup during rendering.
```typescript
const houseMap = {};
planets.forEach(p => {
  const h = Number(p.house);
  if (!houseMap[h]) houseMap[h] = [];
  houseMap[h].push(p.name);
});
```

### Step 2: Determine the "Ladder Length"
For each house row, find the highest index (`maxIdx`) among the planets occupying that house. This index determines where the "ladder" ends and the filled blocks begin.
```typescript
// Inside the house loop:
const planetsInHouse = houseMap[houseNumber] || [];
let maxIdx = -1;
planetsInHouse.forEach(pName => {
  const idx = PLANET_ORDER.indexOf(pName);
  if (idx > maxIdx) maxIdx = idx;
});
```

### Step 3: Render the Grid Row
For each house, iterate through the `PLANET_ORDER` (columns).
1.  **If Planet is present**: Render the Planet Icon.
2.  **If Column Index < `maxIdx` (and planet not present)**: Render a "Filled Block" (the ladder).
3.  **Otherwise**: Render an empty space.

```tsx
{PLANET_ORDER.map((colPlanet, colIdx) => {
  const isPresent = planetsInHouse.includes(colPlanet);
  
  if (isPresent) {
    return <PlanetIcon name={colPlanet} />; // Render Image or Symbol
  }

  if (colIdx < maxIdx) {
    return <div className="size-8 bg-slate-950 rounded" />; // The "Ladder" block
  }

  return <div className="size-8 invisible" />; // Placeholder
})}
```

## 4. Visual Styles (Tailwind CSS)
To achieve the "premium" look seen in the project:
- **Blocks**: Use a very dark background (`bg-slate-950`) with a subtle border (`border-slate-800`) and inner shadow (`shadow-inner`).
- **Icons**: Icons should be clearly distinguishable. Using high-quality PNGs or SVGs is recommended.
- **Hover Effects**: Add `hover:scale-105` and `transition-all` to the blocks and icons to make the interface feel "alive".
- **Tooltips**: Implement tooltips on both the icons and the ladder blocks to provide context (e.g., "Zone: Mercury" when hovering over a block in the Mercury column).

## 5. Assets Needed
- **Planet Images**: Ensure you have a mapping of planet names to image URLs (S3 or local assets).
- **Zodiac Symbols**: A mapping of sign names (Aries, Taurus, etc.) to their respective glyphs/symbols.

## 6. Full Code Reference (React/Next.js Example)
Refer to the component `HousesSection` in `src/app/admin/horoscope/page.tsx` for the full implementation including Tooltips and complex styling.
