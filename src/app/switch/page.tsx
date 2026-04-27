import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPortals } from "@/lib/user-roles";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/marketing/header";
import { LayoutDashboard, User, Share2, Users, GraduationCap, Handshake } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  diviner: LayoutDashboard,
  client: User,
  advocate: Share2,
  community: Users,
  trainee: GraduationCap,
  affiliate: Handshake,
};

export const metadata = { title: "Switch Portal - AstrologyPro" };

export default async function SwitchPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { subscribed } = await searchParams;
  const isSubscribed = subscribed === "true";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const portals = await getUserPortals(supabase, user.id);

  if (portals.length === 1 && !isSubscribed) {
    redirect(portals[0].href);
  }

  if (portals.length === 0) {
    redirect("/join");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {isSubscribed && (
            <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center shadow-lg shadow-emerald-500/10">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
                <Users className="size-6 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-emerald-500">Upgrade Successful!</h2>
              <p className="mt-2 text-sm text-emerald-500/80">
                Welcome to Perennial Mandalism. Your new community portal is now unlocked. 
                Choose it below to complete your setup and sign the community agreements.
              </p>
            </div>
          )}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Choose Your Portal</h1>
            <p className="mt-2 text-muted-foreground">
              You have access to multiple areas. Where would you like to go?
            </p>
          </div>

          <div className="space-y-3">
            {portals.map((p) => {
              const Icon = ICONS[p.role] ?? User;
              return (
                <Card key={p.href} className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{p.label}</p>
                        {p.badge && (
                          <p className="text-xs text-muted-foreground">{p.badge}</p>
                        )}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={p.href}>Enter</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/account"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Manage my account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
