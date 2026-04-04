import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ExternalLink, Star } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Library - AstrologyPro Community" };

// Static content — admins can extend this by adding storage URLs
const HOLY_BOOKS = [
  {
    id: "bhagavad-gita",
    title: "Bhagavad Gita",
    subtitle: "The Song of God",
    description:
      "A 700-verse Hindu scripture that is part of the epic Mahabharata. A conversation between prince Arjuna and his guide Krishna on duty, righteousness, and the nature of the soul.",
    storageKey: "holy-books/bhagavad-gita.pdf",
  },
  {
    id: "gospel-of-thomas",
    title: "Gospel of Thomas",
    subtitle: "The Secret Sayings of Jesus",
    description:
      "114 sayings attributed to Jesus, discovered in Nag Hammadi, Egypt in 1945. A Gnostic text offering a contemplative path to the Kingdom of Heaven within.",
    storageKey: "holy-books/gospel-of-thomas.pdf",
  },
  {
    id: "tao-te-ching",
    title: "Tao Te Ching",
    subtitle: "The Way and Its Virtue",
    description:
      "Lao Tzu's foundational text of Taoism — 81 short chapters on the nature of the Tao, effortless action (wu wei), and living in harmony with the flow of existence.",
    storageKey: "holy-books/tao-te-ching.pdf",
  },
];

const DOCTRINE_LINKS = [
  {
    id: "central-doctrine",
    label: "Central Doctrine",
    description: "The core metaphysical principles of Divine Infinite Being.",
    href: "/community/resources#central-doctrine",
    internal: true,
  },
  {
    id: "fivefold-creed",
    label: "Five-fold Creed",
    description: "The five foundational affirmations of the tradition.",
    href: "/community/resources#fivefold-creed",
    internal: true,
  },
];

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("community_members")
    .select("id, membership_status")
    .eq("user_id", user.id)
    .single();

  if (!member) redirect("/join/community");
  if (member.membership_status !== "active") redirect("/join/community?status=inactive");

  // Generate signed URLs for holy book PDFs from Supabase storage
  const bookUrls: Record<string, string | null> = {};
  for (const book of HOLY_BOOKS) {
    const { data } = await supabase.storage
      .from("community-content")
      .createSignedUrl(book.storageKey, 3600); // 1h signed URL
    bookUrls[book.id] = data?.signedUrl ?? null;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Community Library</h1>
        </div>
        <p className="text-muted-foreground">
          Sacred texts, doctrine references, and teaching materials.
        </p>
      </div>

      {/* Holy Books */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-muted-foreground uppercase tracking-wider">
          <BookOpen className="size-4" />
          Holy Books
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {HOLY_BOOKS.map((book) => {
            const url = bookUrls[book.id];
            return (
              <Card key={book.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{book.title}</CardTitle>
                  <CardDescription>{book.subtitle}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="text-sm text-muted-foreground flex-1">{book.description}</p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FileText className="size-3.5" />
                      Read PDF
                      <ExternalLink className="size-3 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      PDF coming soon
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Doctrine & Creed */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-muted-foreground uppercase tracking-wider">
          <Star className="size-4" />
          Doctrine &amp; Creed
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCTRINE_LINKS.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={item.href}>
                    View
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Diviner CTA */}
      <section>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left sm:gap-8">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Star className="size-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Ready to go deeper?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Book a personal reading with one of our Diviners to explore how these teachings apply to your chart and current transits.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/diviner">Book a Reading</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
