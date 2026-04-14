import { redirect } from "next/navigation";
import { SignedAgreementsClient } from "@/components/legal/signed-agreements-client";
import { createClient } from "@/lib/supabase/server";
import { listSignedAgreementsForUser } from "@/lib/signed-agreements";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Signed Agreements - AstrologyPro" };

export default async function AccountLegalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const agreements = await listSignedAgreementsForUser(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Signed Agreements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View, download, or email the exact agreement snapshots you previously accepted.
        </p>
      </div>

      <SignedAgreementsClient
        agreements={agreements}
        mode="user"
        emptyTitle="No signed agreements yet"
        emptyDescription="Your accepted agreements will appear here once you complete them."
      />
    </div>
  );
}
