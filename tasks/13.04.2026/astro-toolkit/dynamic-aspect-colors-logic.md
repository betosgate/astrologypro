# Logic for Dynamic Aspect Styling (Multi-Color Blocks)

To achieve the multi-colored interpretation blocks seen in the screenshot where each aspect (e.g., Moon Sextile Mars, Venus Trine Neptune) has a unique color, follow this logic in your project.

## 1. The Core Concept
The color of each block is determined by the **primary planet** mentioned in the aspect title. For example:
- **Moon** Sextile Mars → **Grey/Silver**
- **Venus** Trine Neptune → **Green**
- **Jupiter** Conjunction Saturn → **Blue**
- **Mars** Trine Uranus → **Red**

---

## 2. Step-by-Step Implementation

### Step 1: Define Your Color Palette (CSS)
Create CSS classes for each planet using specific gradients.

```css
/* Satellite/Silver for Moon */
.planet-interp-moon {
  background: linear-gradient(166deg, #8c8c8c 0%, #C0C0C0 100%);
  color: #000;
}

/* Lush Green for Venus */
.planet-interp-venus {
  background: linear-gradient(166deg, #00FF00 0%, #32CD32 100%);
  color: #000;
}

/* Deep Blue for Jupiter */
.planet-interp-jupiter {
  background: linear-gradient(166deg, #0000FF 0%, #1E90FF 100%);
  color: #fff;
}

/* Fiery Red for Mars */
.planet-interp-mars {
  background: linear-gradient(166deg, #FF0000 0%, #B22222 100%);
  color: #fff;
}
```

### Step 2: Create a Mapping Utility (JavaScript/TypeScript)
Create a function that takes a planet name and returns the corresponding CSS class.

```typescript
export function getPlanetInterpClass(planetName: string): string {
  const key = planetName?.toLowerCase().trim();
  const map: Record<string, string> = {
    sun: "planet-interp-sun",
    moon: "planet-interp-moon",
    mercury: "planet-interp-mercury",
    venus: "planet-interp-venus",
    mars: "planet-interp-mars",
    jupiter: "planet-interp-jupiter",
    saturn: "planet-interp-saturn",
    uranus: "planet-interp-uranus",
    neptune: "planet-interp-neptune",
    pluto: "planet-interp-pluto",
  };
  // Fallback to a default color if no match
  return map[key] ?? "interp-gradient-default";
}
```

### Step 3: Parse the Aspect Title
You need to extract the first word (the primary planet) from titles like "Moon Sextile Mars".

```typescript
export function parsePrimaryPlanet(title: string): string {
  if (!title) return "";
  // Split by space and take the first word
  return title.split(" ")[0]; 
}
```

### Step 4: Apply the Logic in the Component
When rendering your list of aspects, Use the functions to dynamically set the class name.

```tsx
{aspects.map((item, index) => {
  const primaryPlanet = parsePrimaryPlanet(item.title);
  const colorClass = getPlanetInterpClass(primaryPlanet);

  return (
    <div key={index} className="aspect-block">
      <div className="header">{item.title}</div>
      {/* Apply the dynamic background class here */}
      <div className={cn("content-area", colorClass)}>
        <p>{item.interpretation}</p>
      </div>
    </div>
  );
})}
```

---

## 3. Why This Works
1.  **Consistency**: It aligns the visual experience with the astrological meaning (Red = Mars/Aggression, Blue = Jupiter/Expansion).
2.  **Scalability**: Adding a new planet or asteroid only requires one new CSS class and one line in the mapping function.
3.  **Visual Scannability**: Users can quickly identify "Mars" aspects across a long report just by looking at the color.
