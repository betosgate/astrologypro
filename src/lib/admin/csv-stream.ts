/**
 * Shared streaming CSV helper for admin analytics exports.
 *
 * Emits a UTF-8 BOM so Excel opens non-ASCII content correctly, then
 * a header row, then each yielded row one at a time. Rows can be streamed
 * in batches (cursor-paged) so even large exports stay bounded in memory.
 */

export type CsvCell = string | number | null | undefined;
export type CsvRow = Record<string, CsvCell>;

export function csvResponse(
  filename: string,
  headers: string[],
  rows: AsyncIterable<CsvRow>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // UTF-8 BOM for Excel.
      controller.enqueue(encoder.encode("﻿"));
      controller.enqueue(encoder.encode(headers.join(",") + "\n"));
      try {
        for await (const row of rows) {
          const line = headers.map((h) => escapeCsv(row[h])).join(",");
          controller.enqueue(encoder.encode(line + "\n"));
        }
      } catch (err) {
        controller.error(err);
        return;
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

export function escapeCsv(v: CsvCell): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function dateStampUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Tiny in-memory token bucket for admin export rate limiting. Keeps the
 * last N request timestamps per key and rejects when the window is full.
 * Fine for a single-process deployment; replace with Redis if we scale
 * admin exports horizontally.
 */
const rateBuckets = new Map<string, number[]>();

export function checkExportRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 5 * 60 * 1000,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (bucket.length >= maxRequests) {
    const oldest = bucket[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    rateBuckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }
  bucket.push(now);
  rateBuckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}
