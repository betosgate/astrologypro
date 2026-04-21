import SocialConnectionsPanel from "@/components/social/social-connections-panel";

export const dynamic = "force-dynamic";

export default function DivinerSocialConnectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Social Connections</h1>
        <p className="text-muted-foreground">
          Connect your own social accounts so posts you publish from the app
          go out under your handle. Connections are encrypted and you can
          disconnect at any time.
        </p>
      </div>
      <SocialConnectionsPanel
        scope="diviner"
        returnTo="/dashboard/social-connections"
      />
    </div>
  );
}
