"use server";

/**
 * Server action — manually triggers a cron endpoint using the CRON_SECRET.
 * The secret never touches the client bundle.
 */
export async function triggerCronJob(jobPath: string): Promise<unknown> {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not configured");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (!appUrl) throw new Error("App URL is not configured");

  const base = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  const url = `${base}${jobPath}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${secret}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  return res.json();
}
