# Task 04 — Admin Analytics CSV Exports

- Status: Not Started
- Priority: P0 (Critical)
- Depends On: Task 03 (campaign leaderboard API), 2026-04-21 Task 07 (existing affiliate + commission analytics)
- Blocks: Finance, ops, and partnership teams doing out-of-app reconciliation

## Goal

Add streaming CSV export endpoints to all four admin analytics surfaces. Parent Task 07 specified CSV exports in the Done Definition; they were not implemented. Today, an admin who needs campaign or commission data for reconciliation must screenshot the table or copy rows by hand.

## Current State

- `/admin/analytics/affiliates/page.tsx` — leaderboard UI, no export endpoint.
- `/admin/analytics/affiliates/[id]/page.tsx` — deep-dive UI, no export endpoint.
- `/admin/analytics/commission/page.tsx` — financial view, no export endpoint.
- `/admin/analytics/campaigns/page.tsx` — new per Task 03, export button placeholder.

## Implementation Steps

### 1. Shared CSV streaming helper

Create `src/lib/admin/csv-stream.ts`:

```ts
import type { NextRequest } from "next/server";

type Row = Record<string, string | number | null>;

export function csvResponse(
  filename: string,
  headers: string[],
  rows: AsyncIterable<Row>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(headers.join(",") + "\n"));
      for await (const row of rows) {
        const line = headers.map((h) => escapeCsv(row[h])).join(",");
        controller.enqueue(encoder.encode(line + "\n"));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
```

Iterate rows with server-side cursor paging (e.g., 500 at a time) so a 100k-row export doesn't buffer in memory.

### 2. Four export endpoints

All under `src/app/api/admin/analytics/`. All admin-auth gated (403 otherwise). All accept the same filter params as their parent JSON endpoints, so exporting respects the admin's currently applied filters.

| Endpoint | Filename | Columns |
|---|---|---|
| `GET /api/admin/analytics/affiliates/export` | `affiliates-leaderboard-YYYYMMDD.csv` | affiliate_id, affiliate_type, affiliate_name, active_assignments, active_campaigns, clicks, conversions, commission_cents, bot_rate_pct, top_ip_share_pct |
| `GET /api/admin/analytics/affiliates/[id]/export` | `affiliate-{id}-detail-YYYYMMDD.csv` | conversion_id, booking_id, converted_at, campaign_id, campaign_name, order_amount_cents, commission_amount_cents, reversed_at |
| `GET /api/admin/analytics/campaigns/export` | `campaigns-leaderboard-YYYYMMDD.csv` | campaign_id, campaign_code, campaign_name, owner_type, owner_affiliate_name, diviner_username, destination_label, status, clicks, views, ctr, conversions, cvr, order_revenue_cents, commission_cents, created_at |
| `GET /api/admin/analytics/commission/export` | `commission-YYYYMMDD.csv` | affiliate_id, affiliate_type, affiliate_name, month, conversions, gmv_cents, commission_cents, paid_cents, outstanding_cents |

Column rules:
- Use fields that already exist in the current analytics responses or can be derived deterministically from the underlying tables.
- Do not invent `commission_status` or `payout_status` columns. The current commission API has no payout ledger; `paid_cents` is always `0` and `outstanding_cents = commission_cents`.
- Prefer `affiliate_name` / `owner_affiliate_name` over generic `username` unless the underlying table actually stores a username field for that entity.
- For the affiliate deep-dive export, export conversion-level rows from `campaign_conversions`; do not invent per-day aggregates unless you first add a matching JSON API.

### 3. Wire export buttons on each page

Each analytics page already has (or should have via Task 03) a placeholder export button. Wire it to:

```tsx
<a
  href={`/api/admin/analytics/campaigns/export?${currentFilterQuery}`}
  download
>
  Export CSV
</a>
```

Do NOT use `fetch` + blob unless you need progress UI — the `href + download` pattern streams natively and the browser shows progress.

### 4. Observability

- Log each export with: admin user id, endpoint, filter params, row count, duration. Route through the existing logger; Hard Law #4.
- Rate-limit per admin user: max 10 exports / 5 min (reuse whatever rate limiter is in `src/lib/rate-limit.ts` if one exists; otherwise a simple in-memory token bucket is fine for admin endpoints).
- Keep auth behavior consistent with existing admin analytics routes in this repo: unauthenticated and non-admin callers currently receive `403`.

## Verification Plan

### A. Functional
1. Admin opens `/admin/analytics/campaigns`, applies filters (e.g., 30d, affiliate-owned, active), clicks Export. CSV downloads, first row matches filtered table row count.
2. Open in a spreadsheet — headers present, escaping works for names with commas/quotes.
3. Call each of the four endpoints directly with `?range=all` and diff against the JSON endpoint row counts — must match.

### B. AuthZ
1. Non-admin calls any `/export` endpoint → 403, RFC 9457 problem+json.
2. Logged-out user → 403, matching the current admin analytics route behavior in this repo.

### C. Streaming
1. Seed or simulate ~20k rows. Export: server memory should not spike proportionally (streaming, not buffering). Response should start arriving in <2s.

### D. Rate limit
1. Call an export endpoint 11 times in 5 minutes → 11th returns 429 with `Retry-After`.

## Edge Cases

- Filename with a date: use server-side date, not the client's, so audit logs align.
- BOM for Excel compatibility: prepend `﻿` to the first chunk if the user's exports open in Excel with garbled non-ASCII. (Safe to add unconditionally.)
- Huge exports (>100k rows): cursor-page the source query in batches of 500–1000; don't issue one giant query.
- Reversed conversions in commission export: include them, but mark `reversed_at` in its own column — finance needs to see reversals.

## Out of Scope

- XLSX / Parquet exports. CSV only.
- Scheduled / emailed exports. On-demand only.
- Column customization per user. Fixed column lists per endpoint.

## Rollback Plan

Delete the four route files and the CSV helper. Revert the export-button wiring (back to placeholder). No schema change.
