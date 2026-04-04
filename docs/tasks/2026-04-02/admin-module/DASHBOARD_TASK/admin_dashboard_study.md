# Admin Dashboard Implementation Guide (`/admin-dashboard`)

This document is a comprehensive technical specification for replicating the Admin Dashboard functionality. It covers all API interactions, action buttons, search/sort logic, and conditional rendering requirements.

---

## 1. Route Configuration & Initialization
- **Path**: `/admin-dashboard`
- **Guards**: `AuthGuardService` (Requires logged-in session)
- **Resolver**: `ResolveService`
  - **Endpoint**: `user/user-list`
  - **Purpose**: Fetches the initial table data before the component loads.
  - **Payload**:
    ```json
    {
      "condition": { "limit": 10, "skip": 0 },
      "sort": { "type": "desc", "field": "created_at" },
      "searchcondition": {}
    }
    ```

---

## 2. Core API Endpoints

### 2.1 Initialization & Global Data
| Feature | Endpoint | Method | Payload | Key Response Data |
| :--- | :--- | :--- | :--- | :--- |
| **User Count** | `user/user-list-count` | POST | `{ "condition": {}, "searchcondition": {} }` | `{ "count": number }` |
| **Role List** | `admin/fetch-role-list` | GET | None | `{ "results": [ { "slug": string, "role_name": string } ] }` |
| **Sync Time** | `product-management/fetch-last-printify-sync-time` | GET | None | `{ "results": timestamp }` |
| **Mundane Access**| `user/check-mundane-access-of-user` | POST | `{ "user_id": string }` | `{ "result": { "hasAccess": boolean } }` |

---

## 3. UI Sections & Functional Details

### 3.1 User Management Section
Displays a table of users with advanced management controls.

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint |
| :--- | :--- | :--- |
| **Add User** | Navigates to `/admin-dashboard/add-user` | None |
| **Edit** | Navigates to `/admin-dashboard/edit-user/:_id` | `user/user-single-fecth` (via edit route resolver) |
| **Preview** | Opens a Preview Dialog | `user/user-preview` (POST) |
| **Mundane Astrology** | Opens a Modal (Grant Access) | `user/mundane-astrlogy-read-write-access` (POST) |
| **Status Toggle** | Toggles Active/Inactive status | `user/status-change` (POST) |
| **Delete** | Deletes the selected user(s) | `user/delete-user` (POST) |

#### **Searching & Sorting**
-   **Text Search**: Supports `name` and `email`.
-   **Select Search**: Supports `user_type` (from Role List) and `status` (1 for Active, 0 for Inactive).
-   **Date Search**: Filters by `created_at` range.
-   **Sorting**: Supports `name`, `created_at`, `last_login_time`, `status`, `role`, `email`.
    -   **Format**: `sort: { "field": "column_name", "type": "asc" | "desc" }`.

---

### 3.2 Ingress Charts (Mundane Astrology)
Visible only if `check-mundane-access-of-user` returns `hasAccess: true`.

#### **Action Buttons & Redirections**
| Button | Action / Redirect | API Endpoint |
| :--- | :--- | :--- |
| **Chart Card/Title** | Navigates to `/ingress-chart-details/:_id` | `ingress-charts/get-ingress-chart-by_id` (via detail resolver) |
| **Create Ingress** | Opens a form (slides down) | (Lambda URL POST) |
| **View All Charts** | Navigates to `/ingress-charts-list` | None |
| **View Past/Upcoming** | Reloads list with date filter | `ingress-charts/ingress-chart-list` (POST) |
| **Social Advo Toggle** | Toggles social advocate flag | `ingress-charts/update-social-advo-flag` (POST) |

- **View Past Sample Payload** (Shared for list and count):
  ```json
  {
    "condition": { "limit": 9, "skip": 0 },
    "searchcondition": { "viewPast": true },
    "sort": { "field": "eventTimestamp", "type": "asc" },
    "project": {},
    "token": ""
  }
  ```

#### **Searching Logic**
This section uses multiple autocomplete endpoints for precise filtering:
-   **By Title**: `ingress-charts/title-autocomplete-search-name` (POST)
    -   Payload: `{ "search_str": string }`
-   **By Location**: `ingress-charts/autocomplete-search-by-location` (POST)
    -   Payload: `{ "search_str": string }`
-   **By Author**: `ingress-charts/user-details-autocomplete` (POST)
    -   Payload: `{ "search_str": string }`
-   **By Date Range**: Filters by `eventTimestamp`.
-   **By Sectors**: Filters by `sector_focus` using `$in` operator.

#### **Create Ingress Chart Implementation**
-   **Permission**: Any user with "Mundane Access" can access the form.
-   **Endpoint (External Lambda)**: `https://zjpmzw23o7zs6uxphdq7olwzla0tefdf.lambda-url.us-east-1.on.aws/` (POST)
-   **Payload Structure**:
    ```json
    {
      "steps": ["createCustomIngressChart"],
      "START_DATE": "YYYY-MM-DD",
      "END_DATE": "YYYY-MM-DD",
      "user_id": "string",
      "user_name": "string",
      "user_email": "string",
      "sector_focus": ["governmentAndLeadership", "socialClimateAndPublicMood", ...],
      "TARGET_LOCATIONS": [
        {
          "name": "City Name",
          "type": "city/region",
          "lat": number,
          "lon": number,
          "tz": "Timezone Name"
        }
      ],
      "is_social_advo": boolean
    }
    ```
-   **Auxiliary API**: `astro-ai/fetch_capital_latLon` (POST)
    -   Used to get coordinates/timezone for a city during chart creation.
    -   Payload: `{ "seaarch_string": string }`

---

### 3.3 Ritual Listing Section
Displays a table of rituals with the ability to view configuration details via a modal.

| Button | Action / Redirect | API Endpoint |
| :--- | :--- | :--- |
| **View** | Opens `ritualDetailsViewModal` (no redirect) | `ritual-invocation/ritual-details` (POST) |

#### **Ritual Details Action Button (Deep Dive)**
When the "View" button is clicked, it opens the `ritualDetailsViewModal` and fetches data.

-   **Endpoint**: `ritual-invocation/ritual-details` (POST)
-   **Payload**: `{ "ritual_config_id": string }`
-   **API Sample Response**:
    ```json
    {
        "status": "success",
        "message": "successful",
        "res": [
            {
                "type": "invocation",
                "planet": ["Jupiter"],
                "zodiac": ["Pisces"],
                "gates": ["Fire Gate", "Water Gate"]
            }
        ]
    }
    ```

#### **Transformation & Rendering Logic**
The UI does not just display the raw text. It performs the following transformations:
1.  **Icon Mapping**: The component maps each `planet` and `zodiac` to a specific SVG icon (e.g., "Jupiter" -> Jupiter SVG).
2.  **Elemental Gate Inference**: Although the API returns a `gates` array, the component also has an internal inference system (`inferGates`) that maps planets and zodiacs to their elemental gates:
    - **Fire**: Mars, Jupiter, Aries, Leo, Sagittarius.
    - **Water**: Moon, Neptune, Cancer, Scorpio, Pisces.
    - **Air**: Mercury, Uranus, Libra, Aquarius, Gemini.
    - **Earth**: Venus, Saturn, Capricorn, Taurus, Virgo.
    - **Spirit**: Sun, Pluto.
3.  **Visual Elements**: Each Gate is rendered with a dedicated geometric SVG (e.g., Red Triangle for Fire, Blue inverted Triangle for Water).
4.  **Formatting**: Titles like `type` are converted to Title Case (e.g., "invocation" -> "Invocation").

---

## 4. Replication Checklist
To replicate this dashboard in a new project:
1.  **Auth**: Ensure `login_user_details` cookie is available and contains `userinfo`.
2.  **Shared Components**: The dashboard relies on `Header`, `Footer`, `LoginInfo`, `IngressCharts`, and `RitualListing` components.
3.  **Library Dependency**: The user list uses a generic `lib-listing` component (likely `listing-angular15`).
4.  **Date Formatting**: Dates are formatted using `MMMM D YYYY, h:mm A` for login and `MMMM D YYYY` for creation dates.
5.  **Mundane Permission**: Always check mundane access before initializing the Ingress Charts section.
6.  **Elemental Icons**: Ensure the SVG icon set for planets, zodiacs, and elemental gates is ported over, as they are not provided by the API directly but defined in the component logic.
