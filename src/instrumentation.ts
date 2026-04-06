/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Runs once at server startup (Node.js runtime only).
 * We trim CRON_SECRET here so Next.js 16's built-in cron-header validator
 * never sees a value with leading/trailing whitespace, regardless of what
 * was accidentally set in Vercel's environment variable UI.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.CRON_SECRET) {
      process.env.CRON_SECRET = process.env.CRON_SECRET.trim();
    }
  }
}
