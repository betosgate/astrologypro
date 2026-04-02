import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/constants";
import { GiftPurchaseForm } from "./gift-purchase-form";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function getDiviner(username: string) {
  const supabase = await createClient();
  const { data: diviner } = await supabase
    .from("diviners")
    .select("id, display_name, username, avatar_url, tagline")
    .eq("username", username)
    .eq("is_active", true)
    .single();
  return diviner;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const diviner = await getDiviner(username);
  if (!diviner) return { title: "Not Found" };

  return {
    title: `Gift a Reading with ${diviner.display_name}`,
    description: `Purchase a gift certificate for a reading with ${diviner.display_name} on AstrologyPro.`,
    openGraph: {
      title: `Gift a Reading with ${diviner.display_name}`,
      description: `Give the gift of cosmic insight with ${diviner.display_name}.`,
      url: `${APP_URL}/${username}/gift`,
    },
  };
}

export default async function GiftPage({ params }: PageProps) {
  const { username } = await params;
  const diviner = await getDiviner(username);

  if (!diviner) {
    notFound();
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-violet-100 text-3xl dark:bg-violet-900/30">
            <span role="img" aria-label="gift">&#127873;</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Gift a Reading
          </h1>
          <p className="mt-2 text-muted-foreground">
            Give someone special the gift of cosmic insight with{" "}
            <strong>{diviner.display_name}</strong>.
          </p>
        </div>

        <GiftPurchaseForm
          divinerId={diviner.id}
          divinerName={diviner.display_name}
          username={username}
        />
      </div>
    </section>
  );
}
