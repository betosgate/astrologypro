import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPortals } from "@/lib/user-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { SignOutButton } from "@/components/portal/logout-button";
import Link from "next/link";
import { LayoutDashboard, User, Share2, Users, GraduationCap } from "lucide-react";

const ROLE_ICONS: Record<string, React.ElementType> = {
  diviner: LayoutDashboard,
  client: User,
  advocate: Share2,
  community: Users,
  trainee: GraduationCap,
};

export const metadata = { title: "My Account - AstrologyPro" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const portals = await getUserPortals(supabase, user.id);

  const displayName =
    user.user_metadata?.name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  // Detect if this user uses password auth (not just magic link)
  const hasPasswordAuth = user.identities?.some((i) => i.provider === "email");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{displayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account created</span>
            <span className="font-medium">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* My Portals / Roles */}
      {portals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My Portals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {portals.map((p) => {
              const Icon = ROLE_ICONS[p.role] ?? User;
              return (
                <div key={p.href} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      {p.badge && (
                        <p className="text-xs text-muted-foreground">{p.badge}</p>
                      )}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={p.href}>Open</Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Change Password — only for password-based users */}
      {hasPasswordAuth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      {/* Magic-link only users can't change password here */}
      {!hasPasswordAuth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account uses magic link sign-in. To set a password, use the{" "}
              <Link href="/reset-password" className="text-primary underline-offset-4 hover:underline">
                forgot password
              </Link>{" "}
              flow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
