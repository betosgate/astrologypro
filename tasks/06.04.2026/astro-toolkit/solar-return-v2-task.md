# Blueprint: Solar Return V2 Module Implementation Guide

- Status: Completed (2026-04-08, verified)
- Notes: Solar Return V2 implemented at src/app/readings/solar-return + src/app/api/admin/astro/planet-return/route.ts.

This guide provides a comprehensive technical blueprint for recreating the **Solar Return V2** astrological module. It is designed to be actionable for an AI agent or developer to implement the section from scratch.

---

## 1. Architectural Overview

### Component Hierarchy
- **Module Container:** Handles routing and state for the toolkit.
- **Main Controller (`SolarReturnV2`):** Orchestrates API calls, manages form state, and reactive data binding.
- **Shared Utils:** Autocomplete city search, date formatting, and AI prompt constructors.

### Logical Data Flow
1.  **Input:** User provides Birth Date, Time, and City.
2.  **Normalization:** City input is converted to Lat/Lng/Tzone.
3.  **Parallel Execution:**
    - Fetch Visual Charts (Natal Wheel).
    - Fetch Astrological Data (Planets, Aspects, Cusps).
    - Fetch Fixed Reports (Planet/Aspect Forecasts).
4.  **Sequential AI Logic:** After metallurgical data arrives, send segments to AI Lambda for high-level narrative interpretation.
5.  **State Hydration:** Update UI sections as data chunks arrive.

---

## 2. Data Models (TypeScript)

```typescript
interface SolarReturnData {
  details: {
    native_birth_date: string;
    solar_return_date: string;
    native_age: number | null;
  };
  planets: Array<{
    name: string;
    fullDegree: number;
    normDegree: number;
    sign: string;
    house: number;
    isRetro: string;
    speed: number;
  }>;
  house_cusps: {
    houses: Array<{ house: number; sign: string; degree: number }>;
    ascendant: number;
    midheaven: number;
    vertex: number;
  };
  aspects: Array<{
    solar_return_planet: string;
    natal_planet: string;
    type: string;
    orb: number;
  }>;
}

interface AIResponse {
  solar_return_planet_report: Array<{ name: string; forecast: string[] }>;
  solar_return_aspects_report: Array<{ solar_return_planet: string; natal_planet: string; type: string; forecast: string }>;
  solar_return_details_ai: Array<Record<string, string>>; // AI interpretations of dates
  solar_return_house_cusps_ai: Array<Record<string, string>>; // AI interpretations of house positions
}
```

---

## 3. Core Implementation Logic

### A. Initialization & Form Handling
Use a reactive form with an autocomplete field for the city.
- **City Search API:** `astro-ai/fetch_city_with_latLon`
- **Payload:** `{"searchcondition": {"search_string": query}}`

### B. API Orchestration (The "Submit" Execution)
The controller should trigger the following endpoints upon form submission:

| Endpoint Key | Purpose |
| :--- | :--- |
| `natal_wheel_chart` | Primary SVG visualization |
| `solar_return_details` | Basic date calculations |
| `solar_return_planets` | Planet data array |
| `solar_return_house_cusps` | House data |
| `solar_return_planet_aspects` | Mathematical aspects |
| `solar_return_planet_report` | Pre-defined planetary text |
| `solar_return_aspects_report` | Pre-defined aspect text |

### C. Prompt Engineering for AI Interpretations
For sections requiring AI insight (Details and House Cusps), use the following prompt pattern:

**Template for House Cusps:**
> "Generate western chart details only on solar_return_details based on given json with minimum 3 sentences on each interpretation. Response format: JSON array of objects mapping house/ascendant/midheaven/vertex to interpretation text."

---

## 4. UI/UX Sections

| Section | Content | Logic |
| :--- | :--- | :--- |
| **Header** | Section Title & Form | Sticky or scroll-to-top enabled |
| **Charts** | Dual Natal Wheel Display | Click to open `natalImageModal` |
| **Dates Table** | Native vs Solar Return Dates | Date formatting via `moment.js` |
| **Planets Grid** | Tabular data for planets | Includes Name, House, Sign, Degree, Speed |
| **Aspects Feed** | List of interactive aspect cards | Contains "Show More" interaction |
| **AI Narrative** | Rendered AI text blocks | Paragraph splitting with icon injection |

---

## 5. Specialized Interactions

### Interaction: "Show More" Aspect Detail
1.  **Image Fetch:** `astro-picture-content/fetch_image_from_aws` using filename `Planet-AspectType-NatalPlanet`.
2.  **AI Fetch:** Call Lambda with specific `user_content`:
    > "Generate western chart details only on aspects based on given json with atleast 5 sentences. format {interpretation: data}."
3.  **Modal:** Display result in `showMoreModalAsecdent`.

### Interaction: Admin Sharing
- **Backend:** `astro-ai/save-astro-AI-Response`
- **State:** Save entire `searchData` and `airesultArray` objects.
- **Output:** Public unique ID used for persistent result viewing.

---

## 6. Full API Reference (Payload / Response Samples)

### 1. Fetch Lat Lon (Autocomplete)
**API:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon`  
**Payload:** `{"formvalue":{"date_of_birth":"2000-05-30T18:30:00.000Z","time_of_birth":"1:00 PM","city":"bardhaman"},"searchcondition":{"search_string":"bardhaman"},"secret":"na","token":""}`  
**Sample Response:**
```json
{
    "status": "success",
    "res": [
        {
            "val": "Bardhaman, West Bengal, India",
            "key": {
                "timezone": { "name": "Asia/Kolkata", "utcOffset": "+05:30", "offset_string": "+05:30" },
                "lat": 23.24073, "lng": 87.86733, "label": "Bardhaman, West Bengal, India"
            }
        }
    ]
}
```

### 2. Natal Wheel Chart
**API:** `https://json.astrologyapi.com/v1/natal_wheel_chart`  
**Payload:** `{"hour":13,"min":0,"day":31,"month":5,"year":2000,"lat":23.24073,"lon":87.86733,"tzone":"+05:30"}`  
**Sample Response:**
```json
{
    "status": true,
    "chart_url": "SVG_URL",
    "msg": "Chart created successfully!"
}
```

### 3. Solar Return Planet Aspects
**API:** `https://json.astrologyapi.com/v1/solar_return_planet_aspects`  
**Payload:** Birth details.  
**Sample Response:**
```json
[
    { "solar_return_planet": "Sun", "natal_planet": "Moon", "type": "Opposition", "orb": 2.74 },
    { "solar_return_planet": "Sun", "natal_planet": "Saturn", "type": "Sextile", "orb": 2.04 }
]
```

### 4. Solar Return House Cusps
**API:** `https://json.astrologyapi.com/v1/solar_return_house_cusps`  
**Payload:** Birth details.  
**Sample Response:**
```json
{
    "houses": [
        { "house": 1, "sign": "Sagittarius", "degree": 252.98 }
    ],
    "ascendant": 252.98, "midheaven": 175.78, "vertex": 117.84
}
```

### 5. Solar Return Details
**API:** `https://json.astrologyapi.com/v1/solar_return_details`  
**Payload:** Birth details.  
**Sample Response:**
```json
{
    "native_birth_date": "05-31-2000 13:00:00",
    "native_age": null,
    "solar_return_date": "05-31-2026 19:45:58"
}
```

### 6. Solar Return Planets
**API:** `https://json.astrologyapi.com/v1/solar_return_planets`  
**Payload:** Birth details.  
**Sample Response:**
```json
[
    { "name": "Sun", "fullDegree": 70.16, "normDegree": 10.16, "sign": "Gemini", "house": 5 }
]
```

### 7. Solar Return Planet Report
**API:** `https://json.astrologyapi.com/v1/solar_return_planet_report`  
**Payload:** Birth details.  
**Sample Response:**
```json
[
    { "name": "Mars", "sign": "Taurus", "forecast": ["Forecast 1", "Forecast 2"] }
]
```

### 8. Solar Return Aspects Report
**API:** `https://json.astrologyapi.com/v1/solar_return_aspects_report`  
**Payload:** Birth details.  
**Sample Response:**
```json
[
    { "solar_return_planet": "Venus", "natal_planet": "Jupiter", "type": "Square", "forecast": "Text" }
]
```

### 9. AI Interpretation (Lambda)
**API:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`  
**Payload:** Birth data + custom Astrology prompt.  
**Sample Response:**
```json
{
    "ai_response": "[ {\"ascendant\":\"Text\"}, {\"midheaven\":\"Text\"}, {\"vertex\":\"Text\"} ]"
}
```

### Used api :

# API Reference: Solar Return Module

This document provides a comprehensive technical reference for all 25 API endpoints identified within the Solar Return module. It includes detailed request payloads and sample responses to ensure full system transparency.

## 1. Test Input Data
The following data was used for the examples in this document:
- **Date of Birth:** 5/31/2000
- **Time of Birth:** 01:00 PM
- **City:** Bardhaman, West Bengal, India
- **Latitude:** 23.24073
- **Longitude:** 87.86733
- **Timezone:** +05:30 (Asia/Kolkata)

---

## 2. Location Services

### 2.1 Fetch Latitude and Longitude
Used for city search and retrieving geographic coordinates/timezone data.

- **API URL:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon`
- **Context:** Resolves user-entered city string to coordinates and timezone.
- **Payload:**
```json
{
  "formvalue": {
    "date_of_birth": "2000-05-31T07:30:00.000Z",
    "time_of_birth": "1:00 PM",
    "city": "bardhaman"
  },
  "searchcondition": {
    "search_string": "bardhaman"
  }
}
```
- **Sample Response:**
```json
{
  "status": "success",
  "res": [
    {
      "val": "Bardhaman, West Bengal, India",
      "key": {
        "timezone": { "name": "Asia/Kolkata", "utcOffset": "+05:30", "offset_string": "+05:30" },
        "lat": 23.24073,
        "lng": 87.86733,
        "label": "Bardhaman, West Bengal, India"
      }
    }
  ]
}
```

---

## 3. Core Astrology Data (AstrologyAPI)

### 3.1 Natal Wheel Chart
- **API URL:** `https://json.astrologyapi.com/v1/natal_wheel_chart`
- **Context:** Generates the SVG visualization of the natal chart.
- **Payload:**
```json
{
  "hour": 13, "min": 0, "day": 31, "month": 5, "year": 2000,
  "lat": 23.24073, "lon": 87.86733, "tzone": "+05:30"
}
```
- **Sample Response:**
```json
{ "status": true, "chart_url": "https://s3.ap-south-1.amazonaws.com/western-chart/e3333870-5d5a-11f0-b822-07d6cd6b08e9.svg" }
```

### 3.2 Solar Return Planets
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_planets`
- **Context:** Retrieves planetary positions for the Solar Return year.
- **Sample Response:**
```json
[
  { "name": "Sun", "fullDegree": 70.16, "sign": "Gemini", "house": 5 },
  { "name": "Moon", "fullDegree": 252.90, "sign": "Sagittarius", "house": 11 }
]
```

### 3.3 Solar Return House Cusps
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_house_cusps`
- **Context:** Retrieves house cusp degrees and signs for the Solar Return chart.
- **Sample Response:**
```json
{ "ascendant": 252.98, "midheaven": 175.78, "vertex": 117.84, "houses": [...] }
```

### 3.4 Solar Return Details
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_details`
- **Context:** Calculates the specific Solar Return date and time.
- **Sample Response:**
```json
{ "solar_return_date": "05-31-2026 19:45:58" }
```

### 3.5 Solar Return Planet Aspects
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_planet_aspects`
- **Context:** Identifies mathematical aspects between Solar Return and Natal planets.

---

## 4. Reports & Forecasts (AstrologyAPI)

### 4.1 Solar Return Planet Report
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_planet_report`
- **Context:** Static forecasts based on planet placements in signs.

### 4.2 Solar Return Aspects Report
- **API URL:** `https://json.astrologyapi.com/v1/solar_return_aspects_report`
- **Context:** Forecasts for specific aspects between SR and Natal planets.

### 4.3 Western Horoscope (Core Data)
- **API URL:** `https://json.astrologyapi.com/v1/western_horoscope`
- **Context:** Comprehensive astrological data including planets and aspects.
- **Payload:** `{"day":31, "month":5, "year":2000, "hour":13, "min":0, "lat":23.24, "lon":87.86, "tzone":"+05:30"}`

---

## 5. AI Interpretations - General (Lambda Services)

### 5.1 Ascendant / Midheaven / Vertex Interpretation
- **URL:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details on ascendant, midheaven, vertex..." },
  "json": [{ "ascendant": 252.98, "midheaven": 175.78, "vertex": 117.84 }]
}
```

### 5.2 Planet Information (Comprehensive AI)
- **Context:** AI generation of interpretations for all planets in a single call.

### 5.3 Lilith Interpretation
- **Context:** AI analysis of Lilith's position and influence.

### 5.4 Aspect Interpretation (General)
- **Context:** AI synthesis of interplanetary aspects.

### 5.5 Dharma & Karma Paragraphs
- **Context:** High-level AI interpretation of life purpose and growth areas.

---

## 6. AI Interpretations - Individual Planets (Interactive)

These APIs are triggered when a user clicks "Show More" on a specific planet or aspect.

### 6.1 Moon Interpretation (AI)
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details only on planet moon..." },
  "json": [{"name": "Moon", "sign": "Sagittarius", "house": 11}]
}
```

### 6.2 Sun Interpretation (AI)
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details only on planet sun..." },
  "json": [{"name": "Sun", "sign": "Gemini", "house": 5}]
}
```

### 6.3 Mars Interpretation (AI)
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details only on planet mars..." },
  "json": [{"name": "Mars", "sign": "Taurus", "house": 5}]
}
```

### 6.4 Mercury Interpretation (AI)
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details only on planet mercury..." },
  "json": [{"name": "Mercury", "sign": "Gemini", "house": 5}]
}
```

### 6.5 Jupiter Interpretation (AI)
- **Payload:**
```json
{
  "condition": { "user_content": "Generate western chart details only on planet jupiter..." },
  "json": [{"name": "Jupiter", "sign": "Taurus", "house": 5}]
}
```

### 6.6 Fetch Image from AWS (Pictorial Data)
- **URL:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-picture-content/fetch_image_from_aws`
- **Context:** Retrieves binary image data or S3 URLs for specific astrological aspects or planet placements.
- **Payload:** `{"filename": "Jupiter-In-Taurus", "foldername": "planets"}`
- **Sample Response:** `{"status": "success", "data": {"url": "https://s3.amazonaws.com/..."}}`

---

## 7. Decan Details (S3/CloudFront)

Used for retrieving Tarot cards, Greek daemons, and Decan descriptions.

### 7.1 Decan Details: Moon
- **URL:** `https://d36fwfwo4vnk9h.cloudfront.net/astro_decan_new_infos/fetch-decan-details`
- **Payload:** `{"signs": "Sagittarius", "planet": "Moon"}`
- **Sample Response:**
```json
{
  "results": {
    "tarot_name": "Nine of Wands",
    "greek_daemon": "Aidos",
    "decan": "Second Decan",
    "planet_sign_long_desc": "Moon in the second decan of Sagittarius..."
  }
}
```

### 7.2 Decan Details: Sun
- **Payload:** `{"signs": "Gemini", "planet": "Sun"}`

### 7.3 Decan Details: Mars
- **Payload:** `{"signs": "Taurus", "planet": "Mars"}`

### 7.4 Decan Details: Mercury
- **Payload:** `{"signs": "Gemini", "planet": "Mercury"}`

### 7.5 Decan Details: Jupiter
- **Payload:** `{"signs": "Taurus", "planet": "Jupiter"}`
