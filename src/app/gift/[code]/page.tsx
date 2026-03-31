import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ code: string }>;
}

async function getGiftCertificate(code: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gift_certificates")
    .select(
      "id, code, purchaser_name, recipient_name, amount, remaining_amount, message, expires_at, redeemed_at, created_at, diviners(id, display_name, username, avatar_url)"
    )
    .eq("code", code)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;
  const cert = await getGiftCertificate(code);
  if (!cert) return { title: "Gift Certificate Not Found" };

  const diviner = cert.diviners as any;
  return {
    title: `Gift Certificate - Reading with ${diviner?.display_name ?? "AstrologyPro"}`,
    description: `Redeem your $${cert.remaining_amount} gift certificate for a reading.`,
  };
}

export default async function GiftRedemptionPage({ params }: PageProps) {
  const { code } = await params;
  const cert = await getGiftCertificate(code);

  if (!cert) {
    notFound();
  }

  const diviner = cert.diviners as any;
  const isExpired = cert.expires_at && new Date(cert.expires_at) < new Date();
  const isFullyRedeemed = cert.remaining_amount <= 0;
  const isUsable = !isExpired && !isFullyRedeemed;

  const bookingUrl = diviner
    ? `/${diviner.username}?gift=${cert.code}`
    : "/";

  return (
    <section className="py-16">
      <div className="mx-auto max-w-lg px-4">
        <Card className="overflow-hidden border-violet-200 dark:border-violet-800/40">
          {/* Gift Header */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-8 text-center text-white">
            <div className="mb-3 text-4xl">
              <span role="img" aria-label="gift">&#127873;</span>
            </div>
            <h1 className="text-2xl font-bold">Gift Certificate</h1>
            {diviner && (
              <p className="mt-1 text-violet-200">
                A reading with {diviner.display_name}
              </p>
            )}
          </div>

          <CardContent className="space-y-6 p-6">
            {/* Value Display */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isFullyRedeemed ? "Original Value" : "Value Remaining"}
              </p>
              <p className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                ${cert.remaining_amount.toFixed(2)}
              </p>
              {cert.remaining_amount < cert.amount && (
                <p className="mt-1 text-xs text-muted-foreground">
                  of ${cert.amount.toFixed(2)} original value
                </p>
              )}
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              {isFullyRedeemed ? (
                <Badge variant="secondary">Fully Redeemed</Badge>
              ) : isExpired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge className="bg-green-600 hover:bg-green-700">
                  Active
                </Badge>
              )}
            </div>

            {/* From / Message */}
            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{cert.purchaser_name}</span>
              </div>
              {cert.recipient_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{cert.recipient_name}</span>
                </div>
              )}
              {cert.expires_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">
                    {new Date(cert.expires_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono font-medium">{cert.code}</span>
              </div>
            </div>

            {/* Personal Message */}
            {cert.message && (
              <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4 dark:bg-violet-950/20">
                <p className="italic text-muted-foreground">
                  &ldquo;{cert.message}&rdquo;
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  &mdash; {cert.purchaser_name}
                </p>
              </div>
            )}

            {/* Redeem Button */}
            {isUsable && diviner && (
              <Button
                asChild
                className="w-full bg-violet-600 hover:bg-violet-700"
                size="lg"
              >
                <Link href={bookingUrl}>
                  Redeem - Book a Session with {diviner.display_name}
                </Link>
              </Button>
            )}

            {!isUsable && (
              <p className="text-center text-sm text-muted-foreground">
                This gift certificate is no longer available for redemption.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
