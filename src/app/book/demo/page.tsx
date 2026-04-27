import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  searchParams: Promise<{ template?: string; submission?: string }>;
}

export default async function DemoBookingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const template = params.template?.trim() || "service-template";
  const submissionId = params.submission?.trim() || "";

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Demo Booking Route
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Booking flow placeholder
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This route is a temporary fallback for template CTA actions when no intake form is
          rendered yet.
        </p>
        <div className="mt-6 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <span className="font-medium">Template:</span> {template}
        </div>
        {submissionId && (
          <div className="mt-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <span className="font-medium">Saved submission:</span> {submissionId}
          </div>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href={`/services/${template}`}>Back to Template</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
