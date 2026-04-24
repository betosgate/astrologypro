import Link from "next/link";

export const metadata = {
  title: "Link no longer active — AstrologyPro",
  description: "This affiliate share link has been archived or revoked.",
};

export default function LinkNotActivePage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          This link is no longer active
        </h1>
        <p className="text-muted-foreground">
          The affiliate share link you clicked has been archived by its
          owner, or the underlying partnership has ended. No further
          action is required — you can continue browsing the site.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
