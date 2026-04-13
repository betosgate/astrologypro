"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function MediaActiveToggle({
  itemId,
  active,
  blocked = false,
}: {
  itemId: string;
  active: boolean;
  blocked?: boolean;
}) {
  const router = useRouter();

  async function handleToggle(checked: boolean) {
    const res = await fetch(`/api/dashboard/media/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: checked }),
    });
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(checked ? "Item activated" : "Item deactivated");
    router.refresh();
  }

  return <Switch checked={active} onCheckedChange={handleToggle} size="sm" disabled={blocked} />;
}

export function MediaFeaturedToggle({
  itemId,
  featured,
  blocked = false,
}: {
  itemId: string;
  featured: boolean;
  blocked?: boolean;
}) {
  const router = useRouter();

  async function handleToggle(checked: boolean) {
    const res = await fetch(`/api/dashboard/media/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: checked }),
    });
    if (!res.ok) {
      toast.error("Failed to update featured status");
      return;
    }
    toast.success(checked ? "Item featured" : "Item unfeatured");
    router.refresh();
  }

  return <Switch checked={featured} onCheckedChange={handleToggle} size="sm" disabled={blocked} />;
}

export function MediaDeleteButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this media item? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/dashboard/media/${itemId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to delete item");
      return;
    }
    toast.success("Media item deleted");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Delete media item"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

export function MediaEditButton({ itemId }: { itemId: string }) {
  return (
    <Button variant="ghost" size="icon" className="size-8" asChild aria-label="Edit media item">
      <Link href={`/dashboard/media/${itemId}/edit`}>
        <Pencil className="size-4" />
      </Link>
    </Button>
  );
}

export function MediaReorderButtons({
  itemId,
  allItems,
}: {
  itemId: string;
  allItems: { id: string; sort_order: number }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const index = allItems.findIndex((i) => i.id === itemId);
  const isFirst = index === 0;
  const isLast = index === allItems.length - 1;

  async function move(direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= allItems.length) return;

    const swapItem = allItems[swapIndex];
    const currentItem = allItems[index];

    setLoading(true);
    const res = await fetch("/api/dashboard/media/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          { id: currentItem.id, sort_order: swapItem.sort_order },
          { id: swapItem.id, sort_order: currentItem.sort_order },
        ],
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Failed to reorder items");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => move("up")}
        disabled={isFirst || loading}
        aria-label="Move up"
      >
        <ChevronUp className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => move("down")}
        disabled={isLast || loading}
        aria-label="Move down"
      >
        <ChevronDown className="size-3" />
      </Button>
    </div>
  );
}
