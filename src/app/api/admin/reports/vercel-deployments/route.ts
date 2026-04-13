import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { listRecentVercelDeployments } from "@/lib/vercel-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeploymentRow = {
  id: string;
  name: string;
  status: string;
  url: string | null;
  inspectorUrl: string | null;
  environment: string;
  branch: string | null;
  commitSha: string | null;
  creator: string;
  createdAt: number;
  readyAt: number | null;
};

export interface VercelDeploymentsReportResponse {
  items: DeploymentRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function getMetaValue(meta: Record<string, string | undefined> | null | undefined, keys: string[]): string | null {
  for (const key of keys) {
    const value = meta?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function GET(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1") || 1);
  const pageSizeRaw = Number(req.nextUrl.searchParams.get("pageSize") ?? "10") || 10;
  const pageSize = Math.max(1, Math.min(25, pageSizeRaw));

  try {
    const { deployments } = await listRecentVercelDeployments(50);

    const items: DeploymentRow[] = deployments.map((deployment) => ({
      id: deployment.uid,
      name: deployment.name,
      status: deployment.readyState ?? deployment.state ?? "UNKNOWN",
      url: deployment.url ? `https://${deployment.url}` : null,
      inspectorUrl: deployment.inspectorUrl ?? null,
      environment: deployment.target ?? "preview",
      branch: getMetaValue(deployment.meta, [
        "githubCommitRef",
        "gitlabCommitRef",
        "bitbucketCommitRef",
        "branch",
      ]),
      commitSha: getMetaValue(deployment.meta, [
        "githubCommitSha",
        "gitlabCommitSha",
        "bitbucketCommitSha",
      ]),
      creator:
        deployment.creator?.username ||
        deployment.creator?.email ||
        deployment.creator?.uid ||
        "Unknown",
      createdAt: deployment.createdAt,
      readyAt: deployment.ready ?? null,
    }));

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pagedItems = items.slice(start, start + pageSize);

    const response: VercelDeploymentsReportResponse = {
      items: pagedItems,
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load Vercel deployments.",
      },
      { status: 500 },
    );
  }
}

