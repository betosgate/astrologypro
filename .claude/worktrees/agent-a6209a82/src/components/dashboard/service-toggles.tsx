"use client";

import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ActiveToggle({
  serviceId,
  active,
}: {
  serviceId: string;
  active: boolean;
}) {
  const router = useRouter();

  async function handleToggle(checked: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("services")
      .update({ active: checked })
      .eq("id", serviceId);

    if (error) {
      toast.error("Failed to update service status");
      return;
    }
    toast.success(checked ? "Service activated" : "Service deactivated");
    router.refresh();
  }

  return <Switch checked={active} onCheckedChange={handleToggle} size="sm" />;
}

export function FeaturedToggle({
  serviceId,
  featured,
}: {
  serviceId: string;
  featured: boolean;
}) {
  const router = useRouter();

  async function handleToggle(checked: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("services")
      .update({ featured: checked })
      .eq("id", serviceId);

    if (error) {
      toast.error("Failed to update featured status");
      return;
    }
    toast.success(checked ? "Service featured" : "Service unfeatured");
    router.refresh();
  }

  return (
    <Switch checked={featured} onCheckedChange={handleToggle} size="sm" />
  );
}
