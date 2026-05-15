"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AdminPagination } from "@/components/admin/admin-table-parts";

interface TicketsPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function TicketsPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
}: TicketsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (!value || (key === "page" && value === "1") || (key === "pageSize" && value === "10")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <AdminPagination
      currentPage={currentPage}
      totalPages={totalPages}
      total={total}
      pageSize={pageSize}
      onPageChange={(page) => pushParams({ page: String(page) })}
      onPageSizeChange={(size) => pushParams({ page: "1", pageSize: size })}
      isPending={isPending}
    />
  );
}
