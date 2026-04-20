import SocialConnectionsPanel from "@/components/social/social-connections-panel";

export const dynamic = "force-dynamic";

export default function AdminSocialConnectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brand Social Connections</h1>
        <p className="text-muted-foreground">
          Connect the brand&rsquo;s social accounts. The daily
          social-advocacy cron (configured in{" "}
          <code>/admin/social-advocacy</code>) publishes to every connected
          platform on its schedule. Each platform must be connected here
          before it will receive posts.
        </p>
      </div>
      <SocialConnectionsPanel scope="admin" returnTo="/admin/social-connections" />
    </div>
  );
}
