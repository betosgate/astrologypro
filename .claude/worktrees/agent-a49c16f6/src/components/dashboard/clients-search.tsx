"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRef } from "react";

export function ClientsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by name or email..."
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 w-64"
      />
    </div>
  );
}
