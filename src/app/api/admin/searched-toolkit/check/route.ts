import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/searched-toolkit/check
 * 
 * Checks if a record with the same toolname and form_data already exists.
 * It checks both the 'form_data' column and 'ai_response->formData'.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { toolname, form_data } = body;

    if (!toolname || !form_data) {
      return NextResponse.json({ error: "toolname and form_data are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // We search for records where toolname matches
    // and EITHER form_data matches OR ai_response->formData matches.
    // Since we can't easily do complex OR with jsonb equality in a single .eq call for different paths, 
    // we'll try to find any record that matches the toolname and then filter, 
    // OR we can use rpc if we had one, but let's try to use filters.
    
    const { data: records, error } = await admin
      .from("astro_ai_responses")
      .select("*")
      .eq("toolname", toolname)
      .order("created_at", { ascending: false })
      .limit(20); // Check recent few

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!records || records.length === 0) {
      return NextResponse.json({ status: "not_found" });
    }

    // Helper to compare objects deeply (simple version for JSON)
    const isEqual = (obj1: any, obj2: any) => JSON.stringify(obj1) === JSON.stringify(obj2);

    const match = records.find(r => {
      const dbFormData = r.form_data;
      const aiResponseFormData = r.ai_response?.formData;
      
      return isEqual(dbFormData, form_data) || isEqual(aiResponseFormData, form_data);
    });

    if (!match) {
      return NextResponse.json({ status: "not_found" });
    }

    return NextResponse.json({
      status: "success",
      result: match
    });
  } catch (err) {
    console.error("Error in check-toolkit:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
