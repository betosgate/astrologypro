import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TestimonialsClient } from "@/components/dashboard/testimonials-client";

export const metadata = {
  title: "Testimonials",
};

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!diviner) redirect("/admin");

  // Count new/unreviewed testimonials for the badge
  const { count: newCount } = await admin
    .from("testimonials")
    .select("id", { count: "exact", head: true })
    .eq("diviner_id", diviner.id)
    .in("status", ["submitted", "pending_review", "pending"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
        <p className="text-muted-foreground">
          Manage client reviews and testimonials.
          {(newCount ?? 0) > 0 && (
            <span className="ml-1 font-medium text-yellow-500">
              {newCount} awaiting review.
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            Filter, approve, reject, feature, or hide testimonials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestimonialsClient />
        </CardContent>
      </Card>
    </div>
  );
}
