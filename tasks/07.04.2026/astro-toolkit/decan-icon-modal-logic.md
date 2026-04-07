# Decan Icon Logic - Western Horoscope V2

This document explains the technical logic for displaying and interacting with the **Decan Icon** in the Western Horoscope V2 module.

## 1. Component Scope
The logic is primarily implemented within the `CommonTabilLilithComponent` which handles the Planet Information section.

## 2. Initialization: Fetching Available Decans
When the component is initialized, it needs to know which planets and signs have corresponding decan data.

- **Request**: `avalabelDacen()` (called in `ngOnChanges`)
- **API**: `astro_decan_new_infos/fetch-planet-signs` (GET)
- **Data Retention**: The resulting list of planet-sign combinations is stored in the `dacenPsibality` array.

## 3. Display Logic: `checkDacen()`
The decan icon is not shown for all planets. It only appears if certain prerequisites are met.

- **Check**: The `checkDacen(planetName, type)` function is executed for each planet displayed in the list.
- **Criteria**:
    1. The planet's name must be found in the current report data.
    2. The combination of `planet` and `sign` (e.g., `Sun` in `Virgo`) must exist within the `dacenPsibality` array fetched during initialization.
- **Rendering**: If the function returns `true`, the decan icon (image `dzuommtqurxx-removebg-preview.png`) is rendered in the header of that planet's interpretation block.

## 4. Interaction Logic: `openDacenModal()`
When the user clicks on the Decan Icon, the system follows a multi-step process to fetch and display the decan details.

### Step 1: Fetching Details
- **API Call**: `astro_decan_new_infos/fetch-decan-details` (POST)
- **Payload**: `{ "signs": signName, "planet": planetName }`
- **Goal**: Retrieve the base decan information (e.g., decan number, Greek daemon, tarot name) and existing descriptions.

### Step 2: AI Content Repair (Automatic)
If the database record is incomplete (e.g., missing short or long descriptions for the planet/sign, daemon, or tarot), the system automatically repairs it on the fly:
- **API Call**: `getHttpNewHoroscopePost` (via `extrafetchForDacen`)
- **Action**: Uses AI to generate the missing interpretive text.
- **API Call**: `astro_decan_new_infos/update-decan-details` (POST)
- **Action**: Persists the newly generated AI content back to the database for future use.

### Step 3: Displaying the Modal
- **Component**: `dacenModal`
- **Action**: Opens a full-screen or large modal displaying:
    - **Planet Sign Information**: Detailed interpretation of the planet in that decan.
    - **Greek Daemon**: Information about the daemon associated with the decan.
    - **Tarot Attribution**: The tarot card associated with the decan.

## 5. API Reference: Payloads & Responses

### A. Fetch Available Planet-Signs
Used to populate `dacenPsibality` and determine icon visibility.
- **Endpoint**: `astro_decan_new_infos/fetch-planet-signs` (GET)
- **Sample Response**:
```json
{
  "status": "success",
  "results": [
    { "planet": "Sun", "signs": "Leo" },
    { "planet": "Mars", "signs": "Aries" }
  ]
}
```

### B. Fetch Decan Details
Triggered when the user clicks the decan icon.
- **Endpoint**: `astro_decan_new_infos/fetch-decan-details` (POST)
- **Payload**:
```json
{
  "signs": "Leo",
  "planet": "Sun"
}
```
- **Sample Response**:
```json
{
  "status": "success",
  "results": {
    "_id": "64c7...",
    "planet": "Sun",
    "signs": "Leo",
    "decan": "1st Decan",
    "greek_daemon": "Iadalbaoth",
    "tarot_name": "Five of Wands",
    "planet_sign_short_desc": "...",
    "planet_sign_long_desc": "...",
    "daemon_short_desc": "...",
    "daemon_long_desc": "...",
    "tarot_short_desc": "...",
    "tarot_long_desc": "..."
  }
}
```

### C. AI Content Generation (Internal)
Used only if descriptions are missing in the database.
- **Payload (Fragment)**:
```json
{
  "condition": {
    "system_content": "give response only in json format...",
    "user_content": "What does it mean when you have Sun in the 1st Decan of Leo..."
  },
  "toolname": "other",
  "json": [{ "name": "Sun", "sign": "Leo", ... }]
}
```
- **Sample AI Response**:
```json
{
  "short_format": "Detailed 3 sentence summary.",
  "long_format": "Detailed 5 sentence explanation."
}
```

### D. Update/Save Decan Details
Persists AI-generated content back to the database.
- **Endpoint**: `astro_decan_new_infos/update-decan-details` (POST)
- **Payload**:
```json
{
  "_id": "64c7...",
  "planet_sign_short_desc": "The generated short content...",
  "planet_sign_long_desc": "The generated long content..."
}
```
- **Sample Response**:
```json
{
  "status": "success",
  "results": { ...updatedObject }
}
```
