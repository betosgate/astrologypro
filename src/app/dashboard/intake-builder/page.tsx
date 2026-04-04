import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IntakeBuilderClient } from "@/components/dashboard/intake-builder-client";

export const metadata = {
  title: "Intake Builder",
};

export default async function IntakeBuilderPage() {
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

  if (!diviner) redirect("/onboarding");

  // Fetch all services for this diviner
  const { data: services } = await supabase
    .from("services")
    .select("id, name, category")
    .eq("diviner_id", diviner.id)
    .eq("is_active", true)
    .order("name");

  // Fetch all intake forms for this diviner
  const { data: intakeForms } = await supabase
    .from("intake_forms")
    .select("id, service_id, questions")
    .eq("diviner_id", diviner.id);

  const serviceList = services ?? [];
  const formList = intakeForms ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Intake Builder</h1>
        <p className="text-muted-foreground">
          Customize the questions clients answer before booking each service.
        </p>
      </div>

      {serviceList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Services Found</CardTitle>
            <CardDescription>
              Add at least one service before configuring intake questions.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <IntakeBuilderClient
          divinerId={diviner.id}
          services={serviceList}
          intakeForms={formList}
        />
      )}
    </div>
  );
}
