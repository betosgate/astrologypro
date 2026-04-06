# Master Documentation: Nativity Birth Chart (Western Horoscope V2)

This master document consolidates all technical documentation for the "Nativity Birth Chart" (Western Horoscope V2) module. It provides a comprehensive guide to the service architecture, component structures, API interactions, and technical workflows.

## Table of Contents
1. [Deep Technical Walkthrough](#1-deep-technical-walkthrough-western-horoscope-v2-nativity-birth-chart)
2. [Component & Data Architecture](#2-technical-walkthrough-nativity-birth-chart-western-horoscope-v2)
3. [Full API Reference Documentation](#3-nativity-birth-chart-api-documentation)
4. [Zodiac and Planet Icon Rendering Logic](#4-technical-logic-zodiac-and-planet-icon-rendering)

---

## 1. Deep Technical Walkthrough: Western Horoscope V2 (Nativity Birth Chart)

*Original Source: docs/horoscope_western_v2_walkthrough.md*

### Deep Technical Walkthrough: Western Horoscope V2 (Nativity Birth Chart)

This document provides low-level technical specifications for recreating the "Nativity Birth Chart" (Western Horoscope V2) functionality.

---

## 1. Route & Component Architecture
- **Route**: `/horoscope?tab=western_horoscope_v2`
- **Main Component**: `WesternhoroscopV2Component`
- **Child Components**:
  - `CommonTabilLilithComponent` (Planets & Lilith)
  - `CommonTabilHouseComponent` (Houses)
  - `DharmaKarmaComponent` (Soul Purpose)
  - `CommonTabilAspectsComponent` (Planetary Relationships)
  - `CommonTabilComponentComponent` (Ascendant/Midheaven/Vertex)

---

## 2. Button Action & API Mapping

### A. "Submit" Button (On Birth Form)
- **Component**: `lib-showform` (triggered via `listenFormFieldChange`)
- **Workflow**:
    1.  **Form Validation**: Ensures Date, Time, and City (selected from autocomplete) are valid.
    2.  **Date/Time Processing**: Uses `moment.js` to convert inputs into integers (hour, min, day, month, year).
    3.  **City Search API (Pre-Submit)**: 
        - **Endpoint**: `POST /astro-ai/fetch_city_with_latLon`
        - **Payload**: `{"searchcondition": {"search_string": "City Name"}}`
        - **Response**: `{ "status": "success", "res": [{ "key": { "lat": 23.24, "lng": 87.86, "timezone": { "offset_string": "+05:30" } } }] }`
    4.  **Batch API Trigger**:
        - **API 1 (Astrological Data)**: `POST /western_horoscope` (to Astrology API URL).
        - **API 2 (Natal Chart)**: `POST /natal_wheel_chart` (to Astrology API URL).
        - **API 3 (Free Chart)**: `POST /astro_decan_new_infos/get-free-natal-wheel-chart`.
        - **API 4-9 (AI Interpretations)**: Parallel calls via `extraFeather` to the AI processing Lambda.

### B. "Show More" Buttons (Section Specific)
Each section has a "Show More" button that fetches deeper analysis and a visual asset.

1.  **Planets Section**:
    - **API 1 (Image)**: `POST /astro-picture-content/fetch_image_from_aws`
        - **Payload**: `{"filename": "Sun-In-Gemini", "foldername": "planets"}`
        - **Response**: `{"status": "success", "data": {"url": "S3_URL"}}`
    - **API 2 (AI)**: `POST /getHttpNewHoroscopePost`
        - **Payload**: Large astrological object with a specific prompt for detailed text.
        - **Work**: Generates 2 paragraphs (min 10 sentences) on the planet's significance.

2.  **Houses Section**:
    - **API 1 (Image)**: `POST /astro-picture-content/fetch_image_from_aws`
        - **Payload**: `{"filename": "Gemini-In-9th-House", "foldername": "house"}`
    - **API 2 (AI)**: `POST /getHttpNewHoroscopePost`
        - **Work**: Generates a 3-paragraph detailed meaning of the house.

3.  **Dharma & Karma Section**:
    - **API (AI)**: `POST /getHttpNewHoroscopePost`
        - **Work**: Generates deeply personalized karmic/dharmic interpretations (3 paragraphs per element).

### C. "Decan" Button (Inside Planet Row)
- **Check Availability**: `GET /astro_decan_new_infos/fetch-planet-signs`
- **Work**: Opens `dacenModal` which shows Decan, Greek Daemon, and Tarot card relationships.
- **API**: `POST /astro_decan_new_infos/fetch-decan-details`
    - **Payload**: `{"signs": "Gemini", "planet": "Sun"}`
    - **Response**: Detailed decan object including `greek_daemon`, `tarot_name`, etc.

---

## 3. Detailed API Reference

### 1. Western Horoscope (Raw Data)
- **Endpoint**: `${astrology_api_url}/western_horoscope`
- **Payload**:
  ```json
  { "hour": 1, "min": 0, "day": 31, "month": 5, "year": 2000, "lat": 23.2, "lon": 87.8, "tzone": "+05:30" }
  ```
- **Response Structure**:
  ```json
  {
    "planets": [{ "name": "Sun", "full_degree": 70, "norm_degree": 10, "is_retro": "false", "sign": "Gemini", "house": 9 }],
    "houses": [{ "house": 1, "sign": "Libra", "degree": 186.42 }],
    "aspects": [{ "aspecting_planet": "Sun", "aspected_planet": "Mars", "type": "Conjunction", "orb": 8.88 }],
    "ascendant": 186.42, "midheaven": 96.42, "vertex": 277.28, "lilith": { "name": "Lilith", "sign": "Capricorn", "house": 4 }
  }
  ```

### 2. AI Processing (Lambda)
- **Endpoint**: `${new_astrology_api_url}`
- **Standard Payload Template**:
  ```json
  {
    "condition": {
      "system_content": "give response only in json format... [System instructions for personalized astrology]",
      "user_content": "Generate details on [SECTION] based on given json [PROMPT_SPECIFICS]"
    },
    "toolname": "other",
    "json": [ ASTRO_DATA_OBJECT ]
  }
  ```
- **Response Structure**:
  ```json
  {
    "ai_response": "JSON_STRING_CONTAINING_THE_ASKED_DATA",
    "prompt_tokens": 809,
    "completion_tokens": 1359
  }
  ```

### 3. Save/Share Result
- **Endpoint**: `POST /astro-ai/save-astro-AI-Response`
- **Payload**:
  ```json
  {
    "toolname": "western_horoscope_v2",
    "ai_response": { "planets": [...], "houses": [...], ... },
    "natal_chart": { "chart_url": "..." },
    "formData": { "day": 31, ... },
    "astro_api_data": { "ascendant": 186, ... },
    "freeNatalWheelChart": "..."
  }
  ```
- **Response**: `{ "status": "success", "res": { "_id": "67a3f..." } }`

---

## 4. Key Data Flow Logic

1.  **Form Input** → Converted to astrological coordinates (lat/lon/tzone).
2.  **Coordinates** → `western_horoscope` API → **Raw State** (`accendentData`).
3.  **Raw State** → Segmented into sections (Planets, Houses, etc.).
4.  **Segments** → AI Lambda → **Parsed Interpretations** (`airesultArray`).
5.  **Segments + Interpretations** → Formatted into tables and visual cards.
6.  **"Show More"** → Dynamic filename construction → S3 Fetch → Detail Modal.

---

## 5. RECREATION GUIDE (For AI/Automation)

To replicate this feature:
1.  **Initialize Placidus House System** as the default for all calculations.
2.  **Implement Double Charting**: Fetch one standard SVG chart and one stylized "free" natal wheel.
3.  **Sector-Specific Prompts**: Use the `system_content` prefix: *"Provide a deeply personalized response... speaker directly to your astrology client... interpret using Placidus house system."*
4.  **Media Mapping**:
    - **Planets**: `[PlanetName]-In-[SignName]`
    - **Houses**: `[SignName]-In-[HouseNumber][Suffix]-House`
    - **Aspects**: `[Planet1]-In-[AspectType]-[Planet2]`
5.  **Decan Logic**: Fetch pre-existing relationships from `fetch-planet-signs` and cross-reference with the `sign` and `decan` (determined by degree range 0-10, 10-20, 20-30).

---

## 2. Technical Walkthrough: Nativity Birth Chart (Western Horoscope V2)

*Original Source: docs/nativity_birth_chart_technical_details.md*

### Technical Walkthrough: Nativity Birth Chart (Western Horoscope V2)

This document provides a comprehensive breakdown of the "Nativity Birth Chart" component, triggered by the route `horoscope?tab=western_horoscope_v2`. It details the architecture, component reusability, data fetching, and interactive elements.

---

## 1. Route & Main Component
- **Route**: `/horoscope?tab=western_horoscope_v2`
- **Primary Component**: `WesternhoroscopV2Component`
- **Location**: `src/app/horosceop/components/westernhoroscop-v2/`

---

## 2. Component Architecture

### A. Reusable (Shared) Components
These components are part of the shared design system or third-party libraries and are used across multiple modules in the application.

| Component Name | Source | Purpose |
| :--- | :--- | :--- |
| `lib-showform` | Internal Library | Handles the Birth Details form (Date, Time, City). |
| `app-animation-loader-component` | Shared | A custom Lottie-style animation loader shown while AI data is fetching. |
| `app-network-issue` | Shared | Error state component shown when an API or AI call fails. |
| `mat-progress-bar` | Angular Material | Indicating overall page or section load progress. |
| `mat-spinner` | Angular Material | Used inside buttons and image placeholders during loading. |
| `SafeHtmlPipe` | Pipes | Sanitizes AI-generated HTML content for safe rendering. |

### B. Non-Reusable (Feature-Specific) Components
These components are specifically designed for the Western Horoscope V2 module and reside within its directory structure.

| Component Name | Purpose |
| :--- | :--- |
| `app-common-tabil-lilith` | Displays Planet and Lilith data in tables and detailed AI cards. |
| `app-common-tabil-house` | Displays House placement data and interpretations. |
| `app-common-tabil-aspects` | Displays relationships between planets (Trines, Squares, etc.). |
| `app-dharma-karma` | Specific section for Soul Purpose and Subconscious patterns. |
| `app-common-tabil-component` | Displays Ascendant, Midheaven, and Vertex data. |
| `showMoreModal` | A dynamic modal used to display "Show More" details/images. |
| `dacenModal` | A specialized modal for Decan, Greek Daemon, and Tarot relationships. |

---

## 3. Section-Wise Button Functionality

### 1. Birth Form Section
- **Submit Button**: 
    - **How it works**: Triggers `listenFormFieldChange`. Validates inputs, converts Date/Time to integers, and executes three parallel pipelines:
        1. **Astro Logic**: Calls `/western_horoscope`.
        2. **Visuals**: Calls `/natal_wheel_chart` (SVG) and `/get-free-natal-wheel-chart` (Stylized).
        3. **AI**: Triggers 6 parallel `extraFeather` calls for section-wise interpretations.
- **Reset Button**: Clears all local states, session storage, and hides the result section.

### 2. Main Charts Section
- **Natal Chart Click**: Clicking either the classic or stylized chart opens the `shownewNatalChart` modal for full-screen viewing.
- **View Natal Chart (Floating Button)**: Visible when charts scroll out of view. Re-opens the chart modal.

### 3. Result Sections (Planets/Houses/Aspects)
- **Decan Button (Icon)**: Found next to planet names in the Planet section.
    - **How it works**: Calls `openDacenModal`. Fetches decan details from `/fetch-decan-details`. If AI descriptions (Greek Daemon/Tarot) are missing in the DB, it triggers a live AI fetch and saves it back to the database.
- **Show More Button**: Found at the end of planet/house interpretations.
    - **How it works**: Triggers `shoMoreOption`. 
        1. Fetches a symbolic image from S3 based on mapping (e.g., `Sun-In-Gemini`).
        2. Fetches a deeper 2-paragraph AI interpretation.
        3. Displays both in a `showMoreModal`.

### 4. General Action Buttons
- **Print Button**: Uses an hidden iframe technique to capture the `#printSection` and styles for a clean PDF/Print output.
- **Share Result Button** (Admin only): 
    - **How it works**: Aggregates all AI responses, raw Astro data, and chart URLs into a large JSON. Saves it via `/save-astro-AI-Response` and returns a unique ID for a public URL.
- **Scroll to Top**: Smoothly scrolls the viewport back to the top of the horoscope results.

---

## 4. Data Fetching & AI Integration

### Core Astrological Data
- **Endpoint**: `/western_horoscope`
- **Response Mapping**: Populates the `accendentData` object, which is passed down to all child components to build tables.

### AI Interpretation Pipeline (`extraFeather`)
The system uses "Prompt Engineering" to get structured JSON from AI:
1. **Dynamic Prompts**: It combines user data (e.g., "Sun in Virgo in 10th house") with a system persona (Astrologer).
2. **Parallelization**: To reduce wait time, it doesn't fetch everything at once. It fetches Planet info, House info, and Aspects info in parallel.
3. **Parsing**: The response is parsed from a string to a JSON object and stored in `airesultArray`.

---

## 5. Icons & Visual Assets

### Icon Placement
- **Standard UI Icons**: FontAwesome 4.7 is used for UI actions (Arrow-up for scroll, Print for printing, Eye for viewing, Share-alt for sharing).
- **Zodiac/Planet Icons**: Local assets located in `assets/images/zodiac/`.
    - Placed inside table `<td>` elements using `*ngIf` checks for planet names.
- **Header Illustrations**: Dynamically mapped using a custom pipe (`astroHeaderImage`) that returns S3 URLs based on the planet or house name.

### Image Fetching Logic
- **Endpoint**: `astro-picture-content/fetch_image_from_aws`
- **Pattern**: `[Planet/Sign/House]-In-[Placement]`
- **Context**: 
    - Planet Section: `Sun-In-Gemini`
    - House Section: `Gemini-In-9th-House`
- **Fallback**: If an image is not found, a "No record found" snackbar is shown or it defaults to a standard illustration.

---

## 6. "Show More" Detailed Mechanism
1.  User clicks **Show More**.
2.  `showmore_Loader` is set to `true` for that specific item (showing a progress bar).
3.  `fetchPicture()` runs to get the S3 URL.
4.  `getHttpNewHoroscopePost()` runs to get 10 extra sentences of AI interpretation.
5.  Upon completion, `MatDialog` opens `showMoreModal` with the paired image and text.

---

## 3. Nativity Birth Chart API Documentation

*Original Source: docs/natalchart_api.md*

### Nativity Birth Chart API Documentation

This document provides technical details for the Nativity Birth Chart (Natal Chart) module APIs, including example payloads and responses for a sample birth data.

## Sample Input Selection
- **Date of Birth:** 5/31/2000
- **Time of Birth:** 01:00 PM (13:00)
- **City:** Bardhaman, West Bengal, India

---

## 1. Fetch Latitude & Longitude
**Endpoint:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch_city_with_latLon`

Used to retrieve geographical coordinates and timezone information for a given city.

### Payload
```json
{
  "formvalue": {
    "date_of_birth": "2000-05-30T18:30:00.000Z",
    "time_of_birth": "1:00 PM",
    "city": "bardhaman"
  },
  "searchcondition": {
    "search_string": "bardhaman"
  },
  "secret": "na",
  "token": ""
}
```

### Response
```json
{
  "status": "success",
  "res": [
    {
      "val": "Bardhaman, West Bengal, India",
      "key": {
        "timezone": {
          "name": "Asia/Kolkata",
          "utcOffset": "+05:30",
          "offset_string": "+05:30"
        },
        "lat": 23.24073,
        "lng": 87.86733,
        "label": "Bardhaman, West Bengal, India"
      }
    }
  ]
}
```

---

## 2. Fetch Natal Wheel Chart (SVG)
**Endpoint:** `https://json.astrologyapi.com/v1/natal_wheel_chart`

Generates the Western Natal Wheel chart in SVG format.

### Payload
```json
{
  "hour": 13,
  "min": 0,
  "day": 31,
  "month": 5,
  "year": 2000,
  "lat": 23.24073,
  "lon": 87.86733,
  "tzone": "+05:30"
}
```

### Response
```json
{
  "status": true,
  "chart_url": "https://s3.ap-south-1.amazonaws.com/western-chart/0b0068d0-5ca9-11f0-ae0d-e5450b42a839.svg",
  "msg": "Chart created successfully!"
}
```

---

## 3. Planet & House Information (Western Horoscope)
**Endpoint:** `https://json.astrologyapi.com/v1/western_horoscope`

Retrieves detailed positions of planets and houses for the given birth data.

### Payload
```json
{
  "hour": 13,
  "min": 0,
  "day": 31,
  "month": 5,
  "year": 2000,
  "lat": 23.24073,
  "lon": 87.86733,
  "tzone": "+05:30"
}
```

### Response
```json
{
  "planets": [
    {
      "name": "Sun",
      "full_degree": 70.1697,
      "norm_degree": 10.1697,
      "speed": 0.9589,
      "is_retro": "false",
      "sign_id": 3,
      "sign": "Gemini",
      "house": 9
    },
    {
      "name": "Moon",
      "full_degree": 40.092,
      "norm_degree": 10.092,
      "speed": 14.4256,
      "is_retro": "false",
      "sign_id": 2,
      "sign": "Taurus",
      "house": 8
    },
    {
      "name": "Mars",
      "full_degree": 79.0466,
      "norm_degree": 19.0466,
      "speed": 0.6821,
      "is_retro": "false",
      "sign_id": 3,
      "sign": "Gemini",
      "house": 9
    },
    {
      "name": "Mercury",
      "full_degree": 91.7231,
      "norm_degree": 1.7231,
      "speed": 1.4718,
      "is_retro": "false",
      "sign_id": 4,
      "sign": "Cancer",
      "house": 9
    },
    {
      "name": "Jupiter",
      "full_degree": 53.3416,
      "norm_degree": 23.3416,
      "speed": 0.2322,
      "is_retro": "false",
      "sign_id": 2,
      "sign": "Taurus",
      "house": 8
    },
    {
      "name": "Venus",
      "full_degree": 67.1558,
      "norm_degree": 7.1558,
      "speed": 1.2289,
      "is_retro": "false",
      "sign_id": 3,
      "sign": "Gemini",
      "house": 9
    },
    {
      "name": "Saturn",
      "full_degree": 53.056,
      "norm_degree": 23.056,
      "speed": 0.1252,
      "is_retro": "false",
      "sign_id": 2,
      "sign": "Taurus",
      "house": 8
    },
    {
      "name": "Uranus",
      "full_degree": 320.8098,
      "norm_degree": 20.8098,
      "speed": -0.0049,
      "is_retro": "true",
      "sign_id": 11,
      "sign": "Aquarius",
      "house": 5
    },
    {
      "name": "Neptune",
      "full_degree": 306.435,
      "norm_degree": 6.435,
      "speed": -0.0118,
      "is_retro": "true",
      "sign_id": 11,
      "sign": "Aquarius",
      "house": 4
    },
    {
      "name": "Pluto",
      "full_degree": 251.579,
      "norm_degree": 11.579,
      "speed": -0.0271,
      "is_retro": "true",
      "sign_id": 9,
      "sign": "Sagittarius",
      "house": 3
    },
    {
      "name": "Node",
      "full_degree": 115.5338,
      "norm_degree": 25.5338,
      "speed": -0.1159,
      "is_retro": "true",
      "sign_id": 4,
      "sign": "Cancer",
      "house": 10
    },
    {
      "name": "Chiron",
      "full_degree": 254.42,
      "norm_degree": 14.42,
      "speed": -0.0705,
      "is_retro": "true",
      "sign_id": 9,
      "sign": "Sagittarius",
      "house": 3
    },
    {
      "name": "Part of Fortune",
      "full_degree": 156.3446,
      "norm_degree": 6.3446,
      "speed": 0,
      "is_retro": "false",
      "sign_id": 6,
      "sign": "Virgo",
      "house": 11
    }
  ],
  "houses": [
    {
      "house": 1,
      "sign": "Libra",
      "sign_id": 7,
      "degree": 186.42234
    },
    {
      "house": 2,
      "sign": "Scorpio",
      "sign_id": 8,
      "degree": 215.39624
    },
    {
      "house": 3,
      "sign": "Sagittarius",
      "sign_id": 9,
      "degree": 245.69053
    },
    {
      "house": 4,
      "sign": "Capricorn",
      "sign_id": 10,
      "degree": 276.42033
    },
    {
      "house": 5,
      "sign": "Aquarius",
      "sign_id": 11,
      "degree": 307.33237
    },
    {
      "house": 6,
      "sign": "Pisces",
      "sign_id": 12,
      "degree": 337.81387
    },
    {
      "house": 7,
      "sign": "Aries",
      "sign_id": 1,
      "degree": 6.42234
    },
    {
      "house": 8,
      "sign": "Taurus",
      "sign_id": 2,
      "degree": 35.39624
    },
    {
      "house": 9,
      "sign": "Gemini",
      "sign_id": 3,
      "degree": 65.69053
    },
    {
      "house": 10,
      "sign": "Cancer",
      "sign_id": 4,
      "degree": 96.42033
    },
    {
      "house": 11,
      "sign": "Leo",
      "sign_id": 5,
      "degree": 127.33237
    },
    {
      "house": 12,
      "sign": "Virgo",
      "sign_id": 6,
      "degree": 157.81387
    }
  ]
}
```

---

## 4. Planet Interpretation (AI Enhanced)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Uses AI to generate human-readable interpretations for each planet based on its position.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
    "user_content": "Generate western chart details only on planets based on given json with minimum 10 unique sentences on each planet and its significance with each of house position , full degree, norm degree , speed , sign in as much as detail possible(5 sentences for each of house position , full degree, norm degree , speed , sign all should be with in interpretation not in other index for sure ) . don't miss a single planet there are many please be careful  and response should not start with string 'json'  ever but in proper json format in an array and object in json will be name and interpretation(each of them must have 3 sentences at least) only (nothing else) where both will be string only not object"
  },
  "toolname": "other",
  "json": [
    {
      "name": "Sun",
      "full_degree": 70.1697,
      "norm_degree": 10.1697,
      "speed": 0.9589,
      "is_retro": "false",
      "sign_id": 3,
      "sign": "Gemini",
      "house": 9
    },
    "..."
  ]
}
```

### Response Example
```json
{
  "ai_response": "[ { \"name\": \"Sun\", \"interpretation\": \"The Sun in the 9th house suggests a strong desire for exploration and understanding of the world...\" }, ... ]"
}
```

---

## 5. House Interpretation (AI Enhanced)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Generates AI interpretations for each house based on the zodiac sign ruling it.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
    "user_content": "Generate western chart details only on houses based on given json with minimum 3 sentences on each interpretation with a numnber as index  of  houses in as much as detail possible , only interpretation in json index in lowest level of indexes  please and don't miss a single houses there are many please be careful and response should not start with string 'json'  ever but in proper json format in an array "
  },
  "toolname": "other",
  "json": [
    {
      "house": 1,
      "sign": "Libra",
      "sign_id": 7,
      "degree": 186.42234
    },
    "..."
  ]
}
```

---

## 6. Dharma & Karma Analysis
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Provides a deep analytical summary of an individual's Dharma (soul's path) and Karma (spiritual lessons).

---

## 7. Aspects Analysis (General)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Detailed interpretations of planetary aspects (conjunctions, oppositions, trines, etc.) generated during the initial batch load.

---

## 8. Ascendant, Midheaven & Vertex
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws//`

Interpretations for the key points of the chart: Ascendant (Self), Midheaven (Public Life), and Vertex (Destiny).

---

## 9. Lilith Interpretation
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Interpretations for Black Moon Lilith, representing repressed aspects and primal power.

---

## 10. FIND Planet More Data (Show More Detail)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Detailed breakdown of a specific planet's characteristics.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
    "user_content": "Generate western chart details only onmentioned planet based on given json with detailed signifance of sign . retro , house , degree and speed data given as json format  with atleast 5 sentences or 2 paragraphs  on each mentioned topic in as much as detail possible , remove full degree , norm degree , speed , retrograde , sign , house from  json index and add number as index on each interpretation (e.g {Sun : {1:interpretation data,2:interpretation data,3:interpretation data,4:interpretation data,5:interpretation data}}) please and don't miss a single planet there are many please be careful .Response should not start with string 'json'  ever  and must be a valid json format "
  },
  "toolname": "other",
  "json": [{ "name": "Moon", "full_degree": 40.09, "sign": "Taurus", "house": 8 }]
}
```

---

## 11. FIND Planet House Sign Significance Data (Extended Interpretation)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Provides an even deeper dive (10+ sentences) into planetary significance.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that planet and under that interpretation ",
    "user_content": "Generate western chart details only on planets based on given json with detailed significance of sign . retro , house , degree and speed data given as json format  with atleast 10 sentences or 3 paragraphs on each mentioned topic in as much as detail possible , remove full degree , norm degree , speed , retrograde , sign , house from  json index and add number as index on each interpretation (e.g {Sun : {1:interpretation data,2:interpretation data,3:interpretation data,4:interpretation data,5:interpretation data}}) please and don't miss a single planet there are many please be careful .Response should not start with string 'json'  ever  and must be a valid json format "
  },
  "toolname": "other",
  "json": [{ "name": "Moon", "full_degree": 40.09, "sign": "Taurus", "house": 8 }]
}
```

---

## 12. Find More Data for Aspects (Show More)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Triggered by the "Show More" button in the Aspects section.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation",
    "user_content": "Generate western chart details only on aspects based on given json with atleast 5 sentences the json must be as {interpretation:data} where data in response from chatbot and it must be paragraph / string  but not object type (must not have any index in data or under interpretation index value) for sure.Response should not start with string 'json'  ever  and must be a valid json format  "
  },
  "toolname": "other",
  "json": [{ "aspecting_planet": "Sun", "aspected_planet": "Mars", "type": "Conjunction", "orb": 8.88 }]
}
```

---

## 13. Find More Data for Houses (Show More)
**Endpoint:** `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws/`

Triggered by the "Show More" button in the Houses section.

### Payload
```json
{
  "condition": {
    "system_content": "give response only in json format as a whole , nothing else asnwer as astrolger not AI BOT user data index related to astrolgy as data under that aspect and under that interpretation ",
    "user_content": "Generate western chart details only on only one house provided in json with atleast 5 sentences on 3 paragraphs on each interpretation making sure mentioning significance of house , sign and degree in details , in json I need to see interpreation as index only and nothing else such as {interpretations:{data}} where is the content generated by astrologer and data is paragraph as text not json object and it must not have any inner index .Response should not start with string 'json' ever and must be a valid json format "
  },
  "toolname": "other",
  "json": { "house": 9, "sign": "Gemini", "degree": 65.69 }
}
```

---

## 14. Final Data Saving into DB & Sharing
**Endpoint:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/save-astro-AI-Response`

Saves the complete analyzed report to create a shareable URL.

### Payload (Public Shareable)
```json
{
  "toolname": "western_horoscope_v2",
  "ai_response": { ... },
  "natal_chart": { "chart_url": "..." },
  "formData": { "hour": 13, "min": 0, "day": 31, ... },
  "astro_api_data": { "ascendant": 186.42, ... },
  "freeNatalWheelChart": "..."
}
```

---

## 15. Fetch Shared Result
**Endpoint:** `https://d36fwfwo4vnk9h.cloudfront.net/astro-ai/fetch-save-astro-AI-Response`

Retrieves a saved report using its `_id`.

---

## 16. Internal Record Saving (Customer Profile)
**Endpoint:** `user/save-customer-astro-responce`

Saves the report specifically to a user's account history.

---

## 4. Technical Logic: Zodiac and Planet Icon Rendering

*Original Source: docs/zodiac_planet_icons_technical_logic.md*

### Technical Logic: Zodiac and Planet Icon Rendering

This document explains the implementation details of how zodiac signs and planetary icons are dynamically rendered in the "Nativity Birth Chart" (Western Horoscope V2) module.

---

## 1. Icon Asset Location
All astrological icons are stored as local static assets within the project directory:
`src/assets/images/zodiac/`

These icons are formatted as PNG files and are called by the frontend components based on the data received from the astrological APIs.

---

## 2. Rendering Mechanism: Conditional Logic (`*ngIf`)
The application uses Angular's `*ngIf` structural directive to perform string matching between the API response data and the hardcoded asset paths.

### A. Planet Icons Implementation
In the Planet tables (`common-tabil-lilith.component.html`), the system checks the `name` property of each astrological object:

```html
<!-- Example of Planet Icon Logic -->
<ng-container *ngIf="item.name === 'Sun'">
  <img src="../../../../../assets/images/zodiac/sun.png" alt="Sun" />
</ng-container>

<ng-container *ngIf="item.name === 'Moon'">
  <img src="../../../../../assets/images/zodiac/moon .png" alt="Moon" />
</ng-container>
```

**Planet to Icon Mapping:**
| Planet Name | File Path (`assets/images/zodiac/`) |
| :--- | :--- |
| Sun | `sun.png` |
| Moon | `moon .png` |
| Mercury | `mercury.png` |
| Venus | `venus.png` |
| Mars | `mars .png` |
| Jupiter | `jupiter.png` |
| Saturn | `saturn.png` |
| Uranus | `uranus.png` |
| Neptune | `neptune.png` |
| Pluto | `pluto.png` |
| Node | `node.png` |
| Part of Fortune | `part_of_fortune.png` |
| Chiron | `chiron.png` |

---

### B. Zodiac Sign Icons Implementation
In the House tables (`common-tabil-house.component.html`), the system checks the `sign` property to display the corresponding zodiac icon next to the sign name:

```html
<!-- Example of Zodiac Sign Logic -->
<ng-container *ngIf="item.sign === 'Taurus'">
  <img src="../../../../../assets/images/zodiac/taurus.png" alt="Taurus" />
</ng-container>
```

**Zodiac to Icon Mapping:**
| Zodiac Sign | File Path (`assets/images/zodiac/`) |
| :--- | :--- |
| Aries | `aries.png` |
| Taurus | `taurus.png` |
| Gemini | `gemini.png` |
| Cancer | `cancer.png` |
| Leo | `leo .png` |
| Virgo | `virgo.png` |
| Libra | `libra.png` |
| Scorpio | `scorpio.png` |
| Sagittarius | `sagittarius.png` |
| Capricorn | `capricorn.png` |
| Aquarius | `aquarius.png` |
| Pisces | `pisces.png` |

---

## 3. Dynamic Header Illustrations (`astroHeaderImage` Pipe)
For the detailed AI interpretation sections, the system uses a custom data pipe called `astroHeaderImage`. This pipe dynamically transforms the planet or house name into a URL for a larger header illustration.

- **Usage**: `[src]="aspect.name | astroHeaderImage"`
- **Logic**: It usually maps names to an external S3 bucket where stylized, high-resolution astrological graphics are hosted.

---

## 4. Summary of Logic Flow
1. **API Call**: Database/API returns an array of objects (e.g., `{ "name": "Sun", "sign": "Gemini", "house": 9 }`).
2. **Component Input**: The data is passed to the child components (`app-common-tabil-lilith`, `app-common-tabil-house`).
3. **Template Parsing**: The HTML template iterates through the array.
4. **Matching**: For each item, the `*ngIf` conditions check if the name/sign matches a known astrological entity.
5. **Display**: If a match is found, the `<img>` tag with the relative path to the `assets/images/zodiac/` folder is rendered.
