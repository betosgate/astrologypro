"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Radio,
  Video,
  Globe,
  Info,
  ExternalLink,
} from "lucide-react";

interface LiveSettings {
  id: string;
  youtube_channel_id: string | null;
  facebook_live_url: string | null;
}

export default function LiveStreamPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<LiveSettings | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("diviners")
        .select("id, youtube_channel_id, facebook_live_url")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSettings({
          id: data.id,
          youtube_channel_id: data.youtube_channel_id ?? null,
          facebook_live_url: data.facebook_live_url ?? null,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("diviners")
      .update({
        youtube_channel_id: settings.youtube_channel_id || null,
        facebook_live_url: settings.facebook_live_url || null,
      })
      .eq("id", settings.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save live stream settings");
    } else {
      toast.success("Live stream settings saved");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Info className="size-8 text-destructive" />
        <p className="font-medium">Could not load live stream settings</p>
        <p className="text-sm text-muted-foreground">Please refresh the page or try again later.</p>
        <button onClick={() => window.location.reload()} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">Reload</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Streaming</h1>
        <p className="text-muted-foreground">
          Configure live stream embeds for your public profile page.
        </p>
      </div>

      {/* YouTube Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="size-5 text-red-500" />
            YouTube Live
          </CardTitle>
          <CardDescription>
            Embed your YouTube live stream on your profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-channel-id">YouTube Channel ID</Label>
            <Input
              id="youtube-channel-id"
              value={settings.youtube_channel_id ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  youtube_channel_id: e.target.value,
                })
              }
              placeholder="UCxxxxxxxxxxxxxxxxx"
            />
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Find your Channel ID at{" "}
              <a
                href="https://www.youtube.com/account_advanced"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
              >
                youtube.com/account_advanced
                <ExternalLink className="size-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Globe Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5 text-blue-600" />
            Facebook Live
          </CardTitle>
          <CardDescription>
            Embed your Facebook live stream on your profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebook-live-url">Facebook Live URL</Label>
            <Input
              id="facebook-live-url"
              value={settings.facebook_live_url ?? ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  facebook_live_url: e.target.value,
                })
              }
              placeholder="https://www.facebook.com/yourpage/videos/123456789"
            />
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Paste your Facebook Live video URL when you go live.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {(settings.youtube_channel_id || settings.facebook_live_url) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              This is how the live stream embed will appear on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings.youtube_channel_id && (
              <div>
                <p className="mb-2 text-sm font-medium">YouTube Live</p>
                <div className="overflow-hidden rounded-lg border">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.youtube.com/embed/live_stream?channel=${settings.youtube_channel_id}`}
                      title="YouTube Live Stream Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
            {settings.facebook_live_url && (
              <div>
                <p className="mb-2 text-sm font-medium">Facebook Live</p>
                <div className="overflow-hidden rounded-lg border">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute inset-0 h-full w-full"
                      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(settings.facebook_live_url)}&width=720&autoplay=false`}
                      title="Facebook Live Stream Preview"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Live Stream Settings"
        )}
      </Button>

      <Separator />

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="size-5" />
            How to Go Live
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="mb-1 font-medium text-foreground">YouTube Live</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>
                Enter your YouTube Channel ID above and save.
              </li>
              <li>
                Go to{" "}
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  YouTube Studio
                </a>{" "}
                and start a live stream.
              </li>
              <li>
                Your live stream will automatically appear on your profile page.
              </li>
              <li>
                When you stop streaming, the embed will show your most recent
                stream or a &quot;no live stream&quot; message.
              </li>
            </ol>
          </div>
          <Separator />
          <div>
            <p className="mb-1 font-medium text-foreground">Facebook Live</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Start a live video on your Facebook page.</li>
              <li>Copy the URL of your live video from the address bar.</li>
              <li>Paste the URL above and save.</li>
              <li>
                Remember to clear the URL after your stream ends, or leave it to
                show the replay.
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
