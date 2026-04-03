import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import { APP_URL } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecordingShare } from "@/components/session/recording-share";
import { CalendarDays, Clock, Sparkles, User } from "lucide-react";

interface PageProps {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, actual_duration_minutes, services(name), diviners(display_name, username, avatar_url)"
    )
    .eq("recording_share_id", shareId)
    .single();

  if (!booking) {
    return { title: "Recording Not Found" };
  }

  const divinerName =
    (booking.diviners as any)?.display_name ?? "Diviner";
  const serviceName = (booking.services as any)?.name ?? "Reading Session";
  const title = `${serviceName} with ${divinerName}`;
  const description = `Watch the recording of your ${serviceName} session with ${divinerName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/session/${shareId}/recording`,
      type: "video.other",
      ...(booking.diviners as any)?.avatar_url && {
        images: [
          {
            url: (booking.diviners as any).avatar_url,
            width: 400,
            height: 400,
            alt: divinerName,
          },
        ],
      },
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RecordingPage({ params }: PageProps) {
  const { shareId } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, scheduled_at, actual_duration_minutes, recording_url, services(name), diviners(display_name, username, avatar_url)"
    )
    .eq("recording_share_id", shareId)
    .single();

  if (!booking) {
    notFound();
  }

  const divinerName =
    (booking.diviners as any)?.display_name ?? "Diviner";
  const divinerUsername = (booking.diviners as any)?.username;
  const serviceName = (booking.services as any)?.name ?? "Reading Session";
  const shareUrl = `${APP_URL}/session/${shareId}/recording`;
  const shareTitle = `${serviceName} with ${divinerName}`;
  const shareDescription = `Watch my ${serviceName} reading with ${divinerName} on AstrologyPro.`;

  // Recording not yet processed
  if (!booking.recording_url) {
    return (
      <div className="min-h-screen bg-[#06080f]">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(88,28,135,0.15)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(201,168,76,0.08)_0%,transparent_50%)]" />
        </div>
        <div className="relative mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-[#c9a84c]/20 bg-[#c9a84c]/10">
            <Sparkles className="size-8 text-[#c9a84c]" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-[#f5f0e8]">
            Recording Not Yet Available
          </h1>
          <p className="mt-3 text-[#b8bcd0]/70">
            Your {serviceName} recording with {divinerName} is still being
            processed. Please check back in a few minutes.
          </p>
          {divinerUsername && (
            <a
              href={`/${divinerUsername}`}
              className="mt-8 inline-block rounded-full border border-[#c9a84c]/30 px-6 py-2.5 text-sm font-semibold text-[#c9a84c] transition-all hover:border-[#c9a84c] hover:bg-[#c9a84c]/10"
            >
              Book Another Reading
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-purple-500/20 bg-purple-500/10 text-purple-400"
          >
            <Sparkles className="mr-1.5 size-3" />
            Session Recording
          </Badge>
          <h1 className="text-2xl font-bold md:text-3xl">{serviceName}</h1>
          <p className="mt-1 text-muted-foreground">with {divinerName}</p>
        </div>

        {/* Video Player */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <video
              controls
              className="aspect-video w-full bg-black"
              src={booking.recording_url}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>

        {/* Session Details */}
        <Card className="mb-6">
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>{divinerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              <span>{formatDate(booking.scheduled_at)}</span>
            </div>
            {booking.actual_duration_minutes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{booking.actual_duration_minutes} min</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Buttons */}
        <RecordingShare
          shareUrl={shareUrl}
          title={shareTitle}
          description={shareDescription}
        />

        {/* Book Again CTA */}
        {divinerUsername && (
          <div className="mt-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              Want another reading with {divinerName}?
            </p>
            <Button size="lg" asChild>
              <a href={`/${divinerUsername}`}>
                <Sparkles className="mr-2 size-4" />
                Book Another Reading
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
