# Ingress Charts List Route Study (`/ingress-charts-list`)

This document provides a technical overview of the full Ingress Charts Library route, which allows users to browse, search, and sort all generated ingress charts.

## Route Details
- **Route Path**: `/ingress-charts-list`
- **Associated Component**: `IngressChartsListComponent`
- **Feature Type**: Searchable Infinite-Scroll Library

---

## 1. API Architecture

### 1.1 Core Library Endpoints
| Feature | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Fetch List** | `ingress-charts/ingress-chart-list-view-page` | POST | Retrieves paginated/infinite-scroll chart data. |
| **Fetch Count** | `ingress-charts/ingress-list-count-view-page` | POST | Gets the total count of charts matching filters. |
| **Status Update**| `ingress-charts/update-social-advo-flag` | POST | Toggles the `is_social_advo` boolean on a chart. |

### 1.2 Autocomplete & Filtering Endpoints
| Search Mode | Endpoint | Method | Payload |
| :--- | :--- | :--- | :--- |
| **By Title** | `ingress-charts/title-autocomplete-search-name` | POST | `{ "search_str": string }` |
| **By Location**| `ingress-charts/autocomplete-search-by-location` | POST | `{ "search_str": string }` |
| **By Author** | `ingress-charts/user-details-autocomplete` | POST | `{ "search_str": string }` |

---

## 2. Advanced Search & Sorting Logic

### 2.1 Filtering Capabilities
The library supports complex combined search conditions:
- **Query Params**:
  - `tags`: Filters by chart tags using `$in`.
  - `sectors`: Filters by sector focus using `$in`.
- **UI Filters**:
  - **Date Range**: `startDate` and `endDate` applied to `eventTimestamp`.
  - **View Past Toggle**: Adds `viewPast: true` to the search condition to show historical charts.
    - **View Past Sample Payload**:
      ```json
      {
        "condition": { "limit": 9, "skip": 0 },
        "searchcondition": { "viewPast": true },
        "sort": { "field": "eventTimestamp", "type": "asc" },
        "project": {},
        "token": ""
      }
      ```
      *Note: This specific payload structure is shared across both `ingress-list-count-view-page` and `ingress-chart-list-view-page`.*
  - **Sector Multi-select**: Supports filtering by 8 predefined sectors (e.g., *Weather & Agriculture*, *Public Health*).

### 2.2 Global Sorting Options
| Sort Label | API Payload (`field`, `type`) |
| :--- | :--- |
| **Nearest event dates first** | `{ "field": "eventTimestamp", "type": "asc" }` |
| **Farthest event dates first** | `{ "field": "eventTimestamp", "type": "desc" }` |
| **Nearest Creating dates first** | `{ "field": "createdAt", "type": "asc" }` |
| **Farthest Creating dates first** | `{ "field": "createdAt", "type": "desc" }` |
| **Name (A–Z)** | `{ "field": "title", "type": "asc" }` |
| **Name (Z–A)** | `{ "field": "title", "type": "desc" }` |

---

## 3. Implementation Details

### 3.1 Infinite Scroll
- **Observer**: Uses `IntersectionObserver` on a `#sentinel` div at the bottom of the list.
- **Batched Loading**: Loads 9 items on initial load, then 6 items per scroll trigger.
- **State Management**: Appends new results to `allIngressData` and maintains a `hasMore` flag returned by the API.

### 3.2 Social Advo Logic
Admins can toggle the `is_social_advo` status directly from the list. This triggers an immediate POST call to `update-social-advo-flag`, providing real-time feedback via `MatSnackBar`.

### 3.3 Redirections
- **Chart Click**: Navigates to `/ingress-chart-details/:_id`.
- **"Try Other Search"**: Resets all filters and reloads the default upcoming charts list.
- **Back to Dashboard**: Navigates to `/`.
