"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  Star,
  MoreHorizontal,
  Loader2,
} from "lucide-react";

interface TestimonialActionsProps {
  testimonialId: string;
  currentStatus: string;
  featured: boolean;
}

export function TestimonialActions({
  testimonialId,
  currentStatus,
  featured,
}: TestimonialActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateTestimonial(updates: Record<string, unknown>) {
    setLoading(true);
    const supabase = createClient();

    await supabase
      .from("testimonials")
      .update(updates)
      .eq("id", testimonialId);

    router.refresh();
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" disabled={loading}>
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "approved" && (
          <DropdownMenuItem
            onClick={() => updateTestimonial({ status: "approved" })}
          >
            <CheckCircle className="mr-2 size-4 text-green-500" />
            Approve
          </DropdownMenuItem>
        )}
        {currentStatus !== "rejected" && (
          <DropdownMenuItem
            onClick={() => updateTestimonial({ status: "rejected" })}
          >
            <XCircle className="mr-2 size-4 text-red-500" />
            Reject
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => updateTestimonial({ featured: !featured })}
        >
          <Star
            className={`mr-2 size-4 ${featured ? "fill-yellow-400 text-yellow-400" : ""}`}
          />
          {featured ? "Unfeature" : "Feature"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
