import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star } from "lucide-react";
import { TestimonialActions } from "@/components/dashboard/testimonial-actions";

export const metadata = {
  title: "Testimonials",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-green-500/10 text-green-500 border-green-500/20",
  rejected: "bg-red-500/10 text-red-500 border-red-500/20",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default async function TestimonialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: diviner } = await supabase
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!diviner) redirect("/onboarding");

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("id, rating, text, service_type, status, featured, created_at, clients(full_name, email)")
    .eq("diviner_id", diviner.id)
    .order("created_at", { ascending: false });

  const pendingCount =
    testimonials?.filter((t: any) => t.status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
        <p className="text-muted-foreground">
          Manage client reviews and testimonials.
          {pendingCount > 0 && (
            <span className="ml-1 font-medium text-yellow-500">
              {pendingCount} pending review{pendingCount !== 1 ? "s" : ""}.
            </span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reviews</CardTitle>
          <CardDescription>
            {testimonials?.length ?? 0} testimonial
            {(testimonials?.length ?? 0) !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!testimonials || testimonials.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No testimonials yet. They will appear here once clients leave
              reviews.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className="max-w-[300px]">Review</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testimonials.map((testimonial: any) => (
                      <TableRow key={testimonial.id}>
                        <TableCell className="font-medium">
                          {testimonial.clients?.full_name ??
                            testimonial.clients?.email ??
                            "Unknown"}
                        </TableCell>
                        <TableCell>
                          <StarRating rating={testimonial.rating} />
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate text-sm text-muted-foreground">
                            {testimonial.text}
                          </p>
                        </TableCell>
                        <TableCell>
                          {testimonial.service_type ?? "--"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusColors[testimonial.status] ?? ""}
                            variant="outline"
                          >
                            {testimonial.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(testimonial.created_at)}
                        </TableCell>
                        <TableCell>
                          <TestimonialActions
                            testimonialId={testimonial.id}
                            currentStatus={testimonial.status}
                            featured={testimonial.featured ?? false}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {testimonials.map((testimonial: any) => (
                  <div
                    key={testimonial.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {testimonial.clients?.full_name ??
                          testimonial.clients?.email ??
                          "Unknown"}
                      </p>
                      <Badge
                        className={statusColors[testimonial.status] ?? ""}
                        variant="outline"
                      >
                        {testimonial.status}
                      </Badge>
                    </div>
                    <StarRating rating={testimonial.rating} />
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {testimonial.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {testimonial.service_type ?? "--"} &middot;{" "}
                        {formatDate(testimonial.created_at)}
                      </span>
                      <TestimonialActions
                        testimonialId={testimonial.id}
                        currentStatus={testimonial.status}
                        featured={testimonial.featured ?? false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
