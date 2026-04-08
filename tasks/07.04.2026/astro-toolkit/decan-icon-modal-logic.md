# Decan Icon Logic - Western Horoscope V2

- Status: Documentation (no code action)
- Notes: Reference doc — describes the legacy decan icon component logic. Informational only.

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


# Astro Decan New Infos API Logic Documentation

This document explains the logic and structure of the APIs related to Astro Decan New Information management. These endpoints are handled by the `AstroDecanInfoController` and `AstroDecanInfoService`.

## 1. Fetch Planet Signs
- **Endpoint:** `astro_decan_new_infos/fetch-planet-signs`
- **Method:** `GET`
- **Controller Method:** `fetchPlanetSigns`
- **Service Method:** `fetchPlanetsignsName`

### Logic
This endpoint retrieves a list of all unique combinations of planets and zodiac signs stored in the database. It is typically used to populate dropdowns or selection lists in the admin interface to identify which decans have available data.

### Request
No request body or parameters are required.

### Response
Returns an array of objects containing only the `planet` and `signs` fields (along with the MongoDB `_id`).

```json
{
  "status": "success",
  "message": "Decan name fetched successfully",
  "results": [
    {
      "_id": "64b651...",
      "planet": "Mars",
      "signs": "Aries"
    },
    ...
  ]
}
```

---

## 2. Fetch Decan Details
- **Endpoint:** `astro_decan_new_infos/fetch-decan-details`
- **Method:** `POST`
- **Controller Method:** `fetchDecan`
- **Service Method:** `fetchDecandetails`

### Logic
This endpoint fetches the comprehensive details for a specific decan identified by a planet and a zodiac sign. It queries the `astro_decan_new_infos` collection using both `signs` and `planet` as filters.

### Request Payload (`FetchDecanName`)
| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `signs` | `string` | The name of the zodiac sign | `"Aries"` |
| `planet` | `string` | The name of the planet | `"Mars"` |

### Response
Returns the full decan document, including all descriptions and image paths.

```json
{
  "status": "success",
  "message": "Decan name fetched successfully",
  "results": {
    "_id": "64b651...",
    "planet": "Mars",
    "signs": "Aries",
    "planet_sign_short_desc": "...",
    "planet_sign_long_desc": "...",
    "tarot_card_big_image": "...",
    "tarot_short_desc": "...",
    "tarot_long_desc": "...",
    "daemon_short_desc": "...",
    "daemon_long_desc": "...",
    "greek_daemon": "..."
  }
}
```

---

## 3. Update Decan Details
- **Endpoint:** `astro_decan_new_infos/update-decan-details`
- **Method:** `POST`
- **Controller Method:** `updateDecanDetails`
- **Service Method:** `updateDecanDetails`

### Logic
This endpoint allows updating the interpretive content (descriptions) of an existing decan entry. It uses the `_id` to find the document and updates the various short and long description fields for planet-sign, tarot, and daemon interpretations.

### Request Payload (`DecanDetails`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `string` | The unique ID of the decan record |
| `planet_sign_short_desc` | `string` | Short description for Planet in Sign |
| `planet_sign_long_desc` | `string` | Long description for Planet in Sign |
| `tarot_short_desc` | `string` | Short description for the associated Tarot card |
| `tarot_long_desc` | `string` | Long description for the associated Tarot card |
| `daemon_short_desc` | `string` | Short description for the associated Greek Daemon |
| `daemon_long_desc` | `string` | Long description for the associated Greek Daemon |

### Response
Returns the updated decan document if the operation is successful.

```json
{
  "status": "success",
  "message": "Decan details updated successfully",
  "results": {
    "_id": "64b651...",
    "planet": "Mars",
    "signs": "Aries",
    "planet_sign_short_desc": "Updated text...",
    ...
  }
}
```

---

## Internal Data Structure (`astro_decan_new_infos`)
The underlying MongoDB collection uses the following schema:
- `planet`: `string`
- `signs`: `string`
- `tarot_card_big_image`: `string` (URL/Path)
- `tarot_card_thumb_image`: `string` (URL/Path)
- `greek_daemon`: `string`
- `planet_sign_short_desc`: `string`
- `planet_sign_long_desc`: `string`
- `tarot_short_desc`: `string`
- `tarot_long_desc`: `string`
- `daemon_short_desc`: `string`
- `daemon_long_desc`: `string`
