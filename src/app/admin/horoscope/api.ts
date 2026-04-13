import type { DecanRow } from "./types";

export async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, delay = 1000) {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await fetch(url, options);
      if (r.ok) return r;
      try {
        const d = await r.json();
        lastError = new Error(d.error || d.message || `HTTP ${r.status}`);
      } catch {
        lastError = new Error(`HTTP ${r.status}`);
      }
    } catch (err) {
      lastError = err;
    }
    if (i < maxRetries - 1) {
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw lastError;
}

export async function callCompute(endpoint: string, payload: Record<string, unknown>) {
  const r = await fetchWithRetry("/api/admin/astro/compute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint, payload }) });
  return r.json();
}

export async function callAI(aiPayload: Record<string, unknown>, areaOfInquiry?: string) {
  const r = await fetchWithRetry("/api/admin/astro/ai-interpret", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ aiPayload, areaOfInquiry }) });
  return r.json();
}

export async function callPlanetReturn(body: Record<string, unknown>) {
  const r = await fetchWithRetry("/api/admin/astro/planet-return", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export async function callNatalWheel(body: Record<string, unknown>) {
  const r = await fetchWithRetry("/api/admin/astro/natal-wheel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json();
}

export async function callDecanLookup(signs: string, planet: string) {
  const r = await fetchWithRetry("/api/astro-decan/fetch-decan-details", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signs, planet })
  });
  const json = await r.json();
  const row = json.results;
  if (row && !Array.isArray(row)) {
    let decanNum = 1;
    if (typeof row.decan === "string") {
      const match = row.decan.match(/\d+/);
      if (match) decanNum = parseInt(match[0], 10);
    } else if (typeof row.decan === "number") {
      decanNum = row.decan;
    }
    return {
      results: [{
        ...row,
        sign_name: row.signs || signs,
        decan: decanNum
      }]
    };
  }
  return json as { results: DecanRow[] };
}
