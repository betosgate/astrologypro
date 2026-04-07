import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentsTableClient, type PaymentRow } from "@/components/admin/payments-table-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments — Admin" };

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentsSearchParams {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: string;
  paymentFrom?: string;
  paymentTo?: string;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

const ALLOWED_SORT_COLUMNS = [
  "created_at",
  "client_name",
  "client_email",
  "service_name",
  "amount_charged",
  "status",
];

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getPayments(params: PaymentsSearchParams) {
  const admin = createAdminClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const rawPageSize = parseInt(params.pageSize ?? String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = ALLOWED_PAGE_SIZES.includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const sortBy = ALLOWED_SORT_COLUMNS.includes(params.sortBy ?? "")
    ? params.sortBy!
    : "created_at";
  const sortDir = params.sortDir === "asc" ? "asc" : "desc";
  const ascending = sortDir === "asc";

  const paymentFrom = params.paymentFrom?.trim() ?? "";
  const paymentTo = params.paymentTo?.trim() ?? "";

  const offset = (page - 1) * pageSize;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = admin
    .from("bookings")
    .select(
      "id, client_name, client_email, service_name, scheduled_at, amount_charged, stripe_payment_id, status, created_at, diviner_id",
      { count: "exact" },
    )
    .order(sortBy, { ascending })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Date filters on created_at
  if (paymentFrom) {
    query = query.gte("created_at", paymentFrom);
  }
  if (paymentTo) {
    query = query.lte("created_at", paymentTo + "T23:59:59Z");
  }

  const { data, count, error } = await query;
  if (error) {
    console.error("[admin/payments page]", error);
  }

  return {
    payments: (data ?? []) as PaymentRow[],
    total: count ?? 0,
    page,
    pageSize,
    sortBy,
    sortDir,
    paymentFrom,
    paymentTo,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<PaymentsSearchParams>;
}) {
  const params = await searchParams;
  const { payments, total, page, pageSize, sortBy, sortDir, paymentFrom, paymentTo } =
    await getPayments(params);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <PaymentsTableClient
      payments={payments}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      sortBy={sortBy}
      sortDir={sortDir}
      paymentFrom={paymentFrom}
      paymentTo={paymentTo}
    />
  );
}
