# Task 01 - Implement Astro Charts Polling and Display - 2026-04-02

- Status: Todo
- Priority: P1
- Parent Task: `00-master-task.md`

## Goal

Implement the Natal Chart and Monthly Transit polling and rendering logic in the Next.js `PerennialDashboardPage`. 

## Tasks

- [ ] Define `ChartData` and `MonthlyData` interfaces matching the Angular implementation.
- [ ] Implement a polling mechanism using `useEffect` and `setInterval` (10s) for `/user/customer-astro-response-details-fetch`.
    - **Endpoint:** `POST` `/user/customer-astro-response-details-fetch` (VERIFIED: Must include leading slash)
    - **Payload (Natal):** `{ "astro_toolkit_tab": "western_horoscope_v2", "userid": "USER_ID" }` (VERIFIED: `userid` is all lowercase)
    - **Payload (Monthly):** `{ "astro_toolkit_tab": "tropical_transits_monthly_v3", "userid": "USER_ID" }` (VERIFIED: `userid` is all lowercase)
    - *Absolute Guarantee: These matches the Angular network logs 1:1.*
- [ ] Create two states: `natalChart` and `monthlyTransit`.
- [ ] Add loading states and skeletons/spinners to match the "Your chart is preparing..." UX in Angular.
- [ ] Render two distinct cards: "Your Natal Chart" and "Monthly Transit".
- [ ] Implement the tooltips ("i" icon) for each chart explaining their purpose.
- [ ] Add "View Full Chart" and "View Detailed Transit Report" buttons linking to the full reports.

## Done Definition

- Natal and Monthly charts are displayed only when data is returned by the API.
- Polling correctly stops once data is received.
- Loading states are visual and clear.
- Full chart buttons navigate correctly.

## Verification Plan

- Manually verify that the dashboard starts in a loading state for charts.
- Confirm the `customer-astro-response-details-fetch` API is called every 10 seconds until it returns `data`.
- Ensure the image and interpretation text are correctly displayed once loaded.
