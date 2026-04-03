"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DiscountActionsProps {
  ruleId: string;
  isActive: boolean;
}

export function DiscountActions({ ruleId, isActive }: DiscountActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const res = await fetch("/api/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ruleId, is_active: !isActive }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Failed to update discount");
      return;
    }
    toast.success(isActive ? "Discount deactivated" : "Discount activated");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Deactivate this discount rule?")) return;
    setLoading(true);
    const res = await fetch("/api/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ruleId, is_active: false }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Failed to deactivate discount");
      return;
    }
    toast.success("Discount deactivated");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          {isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        {isActive && (
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            Disable
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
