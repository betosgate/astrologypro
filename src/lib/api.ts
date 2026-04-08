"use client";

const AUTH_UNAUTHORIZED_EVENT = "app:auth-unauthorized";

function normalizeUrl(input: RequestInfo | URL): URL | null {
  if (typeof window === "undefined") return null;

  if (input instanceof URL) return input;
  if (input instanceof Request) return new URL(input.url, window.location.origin);
  return new URL(String(input), window.location.origin);
}

export function isApiRequest(input: RequestInfo | URL): boolean {
  const url = normalizeUrl(input);
  if (!url) return false;
  return url.origin === window.location.origin && url.pathname.startsWith("/api/");
}

export function dispatchUnauthorizedApiEvent(detail?: { path?: string | null }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
      detail: { path: detail?.path ?? null },
    }),
  );
}

export function onUnauthorizedApiEvent(handler: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = () => handler();
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
  return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, listener);
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && isApiRequest(input)) {
    const url = normalizeUrl(input);
    dispatchUnauthorizedApiEvent({ path: url?.pathname ?? null });
  }
  return response;
}
