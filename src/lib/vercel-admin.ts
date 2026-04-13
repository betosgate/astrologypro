import { readFile } from "node:fs/promises";
import path from "node:path";

export interface VercelDeploymentItem {
  uid: string;
  name: string;
  url: string | null;
  state: string;
  readyState?: string | null;
  createdAt: number;
  buildingAt?: number | null;
  ready?: number | null;
  target?: string | null;
  inspectorUrl?: string | null;
  creator?: {
    uid?: string;
    username?: string;
    email?: string;
  } | null;
  meta?: Record<string, string | undefined> | null;
}

interface VercelDeploymentsResponse {
  deployments: VercelDeploymentItem[];
  pagination?: {
    count?: number;
    next?: number | null;
    prev?: number | null;
  };
}

async function readLocalProjectConfig(): Promise<{ projectId?: string; orgId?: string }> {
  try {
    const filePath = path.join(process.cwd(), ".vercel", "project.json");
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { projectId?: string; orgId?: string };
    return parsed;
  } catch {
    return {};
  }
}

export async function getVercelAdminConfig() {
  const localConfig = await readLocalProjectConfig();
  const accessToken =
    process.env.VERCEL_ACCESS_TOKEN?.trim() ||
    process.env.VERCEL_ADMIN_ACCESS_TOKEN?.trim() ||
    "";
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    localConfig.projectId ||
    "";
  const teamId =
    process.env.VERCEL_TEAM_ID?.trim() ||
    localConfig.orgId ||
    "";

  return {
    accessToken,
    projectId,
    teamId,
  };
}

export async function listRecentVercelDeployments(limit = 50) {
  const { accessToken, projectId, teamId } = await getVercelAdminConfig();

  if (!accessToken) {
    throw new Error("Missing VERCEL_ACCESS_TOKEN.");
  }
  if (!projectId || !teamId) {
    throw new Error("Missing Vercel project configuration.");
  }

  const params = new URLSearchParams({
    projectId,
    teamId,
    limit: String(Math.max(1, Math.min(limit, 50))),
  });

  const response = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Vercel API failed with ${response.status}`);
  }

  const json = (await response.json()) as VercelDeploymentsResponse;
  return {
    deployments: json.deployments ?? [],
    pagination: json.pagination ?? {},
  };
}

