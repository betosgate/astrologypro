import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 3600;

const VALID_TYPES = [
  "customer_terms",
  "diviner_agreement",
  "affiliate_agreement",
  "privacy_policy",
  "telephony_consent",
] as const;

type LegalType = (typeof VALID_TYPES)[number];

interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  effective_date: string;
  created_at: string;
}

export async function generateStaticParams() {
  return VALID_TYPES.map((type) => ({ type }));
}

async function fetchDocument(type: string): Promise<LegalDocument | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("legal_documents")
    .select("id, document_type, version, title, content, effective_date, created_at")
    .eq("document_type", type)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as LegalDocument;
}

export async function generateMetadata({
  params,
}: {
  params: { type: string };
}): Promise<Metadata> {
  if (!VALID_TYPES.includes(params.type as LegalType)) {
    return { title: "Not Found" };
  }
  const doc = await fetchDocument(params.type);
  if (!doc) return { title: "Legal Document" };
  return {
    title: `${doc.title} | AstrologyPro`,
    description: `Read our ${doc.title}. Version ${doc.version}, effective ${doc.effective_date}.`,
  };
}

export default async function LegalPage({ params }: { params: { type: string } }) {
  if (!VALID_TYPES.includes(params.type as LegalType)) {
    notFound();
  }

  const doc = await fetchDocument(params.type);
  if (!doc) {
    notFound();
  }

  const formattedDate = new Date(doc.effective_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#06080f", color: "#f5f0e8" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-8 border-b pb-6" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
          <h1 className="mb-3 text-3xl font-bold tracking-tight">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: "#a89880" }}>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{ borderColor: "#c9a84c", color: "#c9a84c" }}
            >
              Version {doc.version}
            </span>
            <span>Effective {formattedDate}</span>
          </div>
        </div>

        {/* Content */}
        <pre
          className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed"
          style={{ color: "#f5f0e8" }}
        >
          {doc.content}
        </pre>
      </div>
    </div>
  );
}
