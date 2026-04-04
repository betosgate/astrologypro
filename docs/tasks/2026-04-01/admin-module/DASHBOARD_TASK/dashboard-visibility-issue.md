# Dashboard Visibility Issue - April 1st, 2026

## Overview
This document explains why the **Ingress Charts** and **Ritual List** are currently not visible on the Admin Dashboard (`src/app/(admin)/admin/dashboard/page.tsx`).

## 1. Ingress Charts Section

### Observed Behavior
The Ingress Charts section is registered in the dashboard code but does not appear on the UI.

### Reason
The `IngressChartsSection` component is using the **v2 nested pagination format**:
```tsx
const { data, isLoading, isFetching } = useApiList<IngressChart>("ingress-charts/ingress-chart-list", {
  // ...
  nestedPagination: true,
});
```
- **Context**: The `nestedPagination: true` flag wraps pagination parameters (`limit`, `skip`) inside a `condition` object. 
- **Root Cause**: The backend endpoint `ingress-charts/ingress-chart-list` likely does not support this new structure yet. When sent an incompatible payload, the API returns zero methodology-matched records.
- **Side Effect**: The component contains a logic gate to return `null` if the data count is zero (to keep the dashboard clean), effectively hiding the section entirely.

---

---

## 2. Ritual List Section

### Observed Behavior
No Ritual List is visible on the Dashboard.

### Reason
The Ritual List is missing from the dashboard for two main reasons:
1.  **Missing Integration**: The `AdminDashboardPage` component does not yet include a reference or import for any Ritual List section.
2.  **Standalone Management Module**: Following the latest update, a new **Ritual Invocation Management** system was introduced at `/admin/ritual-invocation`. This is currently implemented as a standalone management page and has not yet been extracted as a simplified dashboard component.

---

## 3. API Count Details & Payloads
The dashboard components require accurate record counts to function correctly. If the list API does not return a count by default, a dedicated count endpoint must be provided to `useApiList`.

### Ingress Charts Endpoints
- **List API**: `ingress-charts/ingress-chart-list`
- **Count API**: `ingress-charts/ingress-list-count`
- **Current Issue**: The `IngressChartsSection` is currently calling the list API alone without specifying the count endpoint, which potentially causes the `data.count` to be `undefined` or `0`.

### Ritual Invocations Endpoints
- **List API**: `ritual-invocation/ritual-list`
- **Count API**: `ritual-invocation/ritual-list-count`
- **Current Issue**: The Ritual List is entirely missing from the dashboard page and needs to be integrated using these endpoints.

### Expected Payload Structure (Both)
Both the list and count APIs expect a standardized "v1" payload structure (non-nested pagination):

```json
{
  "condition": {
    "limit": 10,
    "skip": 0
  },
  "sort": {
    "type": "desc",
    "field": "createdon" 
  },
  "searchcondition": {}
}
```

*   **Note**: Search queries and specific filter fields (like `user_type` or `status`) should be placed inside the `searchcondition` object.
*   **Recommendation**: Both sections should use `nestedPagination: false` to match this backend requirement.

---

## Summary table
| Feature | List Endpoint | Count Endpoint | Status | Reason for Not Showing |
| :-- | :-- | :-- | :-- | :-- |
| **Ingress Charts** | `...chart-list` | `...list-count` | Code Present | Missing Count API & Wrong Payload |
| **Ritual List** | `...ritual-list` | `...list-count` | Missing | Not integrated into `dashboard/page.tsx` |
