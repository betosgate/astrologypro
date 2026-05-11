import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: campaign, error } = await supabase
    .from("affiliate_campaigns")
    .select("*, diviners(username, is_active), service_templates(slug, is_active, is_general)")
    .eq("id", "1c3b3b19-6471-4829-9b88-0d3901d1cd1d")
    .single();

  console.log(JSON.stringify(campaign, null, 2));
}

run().catch(console.error);
