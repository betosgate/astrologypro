import { createAdminClient } from "@/lib/supabase/admin";
import { LegalClient } from "@/components/admin/legal-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Legal Documents | Admin" };

interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  effective_date: string;
  created_at: string;
}

async function fetchDocuments(): Promise<LegalDocument[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("legal_documents")
    .select("id, document_type, version, title, content, is_active, effective_date, created_at")
    .order("document_type", { ascending: true })
    .order("created_at", { ascending: false });
  return (data as LegalDocument[]) ?? [];
}

async function fetchAcceptanceCounts(): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("legal_acceptances")
    .select("document_id");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.document_id] = (counts[row.document_id] ?? 0) + 1;
  }
  return counts;
}

export default async function AdminLegalPage() {
  const [documents, acceptanceCounts] = await Promise.all([
    fetchDocuments(),
    fetchAcceptanceCounts(),
  ]);

  return <LegalClient documents={documents} acceptanceCounts={acceptanceCounts} />;
}
