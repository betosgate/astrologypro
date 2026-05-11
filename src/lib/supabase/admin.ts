import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

export function createAdminClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "").trim();
        if (k === "NEXT_PUBLIC_SUPABASE_URL") url = v;
        if (k === "SUPABASE_SERVICE_ROLE_KEY") key = v;
      }
    }
  }

  if (!url || !key) {
    throw new Error("Missing Supabase URL or Service Role Key in environment or .env file");
  }

  return createSupabaseClient(url, key);
}
