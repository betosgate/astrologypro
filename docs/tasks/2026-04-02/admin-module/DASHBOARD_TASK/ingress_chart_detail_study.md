# Ingress Chart Detail Route Study (`/ingress-chart-details/:_id`)

This document provides a technical overview of the Ingress Chart Detail route, which displays detailed analysis and interpretations for a specific seasonal ingress chart.

## Route Details
- **Route Path**: `/ingress-chart-details/:_id`
- **Associated Component**: `IngressChartDetailComponent`
- **Resolver**: `ResolveService`
  - **Endpoint**: `ingress-charts/get-ingress-chart-by_id`
  - **Payload**: `{ "id": paramsId }`

---

## 1. API Implementation & Data Structure

### 1.1 Initial Load (Resolver)
- **Endpoint**: `ingress-charts/get-ingress-chart-by_id`
- **Method**: `POST`
- **Purpose**: Retrieves all metadata, interpretations, and related insights for a single ingress chart.
- **Sample Response**:
  ```json
  {
    "status": "success",
    "result": {
      "id": "689050fa909f0a28199bad4c",
      "title": "Winter Ingress 2026",
      "location": "New York, USA",
      "timestamp": "2026-12-21T15:44:00Z",
      "period": "Winter 2026",
      "author": [{ "name": "Admin", "email": "admin@example.com" }],
      "sector_focus": ["governmentAndLeadership", "socialClimateAndPublicMood"],
      "importance": { "level": "High", "color": "red" },
      "interpretation": {
        "intro": "General overview of the period...",
        "body": ["Detailed point 1", "Detailed point 2"]
      },
      "chartRuler": [{ "icon": "jupiter-icon", "text": "Jupiter in Pisces" }],
      "challengesAndStrengths": [{ "icon": "strength-icon", "text": "Strong resilience" }],
      "tags": ["Winter", "Solstice"],
      "relatedInsights": [ ... ],
      "hasMore": true
    }
  }
  ```

### 1.2 Infinite Scroll (Related Insights)
- **Endpoint**: `ingress-charts/get-ingress-chart-by_id`
- **Method**: `POST`
- **Reason**: Loads more "Related Insights" as the user scrolls down.
- **Payload**:
  ```json
  {
    "id": "689050fa909f0a28199bad4c"
  }
  ```

---

## 2. Interactive Features & Navigation

### 2.1 Navigation Actions
| Action | Destination | Purpose |
| :--- | :--- | :--- |
| **Related Insight Click** | `/ingress-chart-details/:_id` | Navigates to the detail page of a related chart. |
| **Tag Click** | `/ingress-charts-list?tags=:tag` | Filters the library by the selected tag. |
| **Sector Click** | `/ingress-charts-list?sectors=:sector` | Filters the library by the selected sector. |
| **Back Button** | `/` | Returns to the home page (or dashboard). |

### 2.2 Share Modal
- **Purpose**: Generates a shareable URL for the current report.
- **Logic**: Concatenates the base domain with `/reports/` and the chart ID.
- **Feature**: Includes a "Copy" button that uses `navigator.clipboard` and shows a "Link Copied" snackbar.

---

## 3. UI Implementation Details
- **Intersection Observer**: Uses `IntersectionObserver` on the `#infiniteAnchor` element to trigger `loadInsights()` automatically when the user reached the bottom of the related insights list.
- **Date Formatting**: Uses a custom `getFormattedDate` method to display dates in the format: `21st December, 2026 3.44 pm`.
- **Author Display**: Defaults to "System Generated" if no author array is provided in the API response.
