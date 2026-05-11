import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const divinerId = "50559eec-600b-4547-92a8-d9c1b0d98888";
  const templateId = "1314fd53-9c70-4393-a961-ca4d04e726e6";

  const { data: ds, error } = await supabase
    .from("diviner_services")
    .select("*")
    .eq("diviner_id", divinerId)
    .eq("template_id", templateId)
    .maybeSingle();

  if (error) console.error("Error:", error);
  console.log("Diviner Service:", JSON.stringify(ds, null, 2));

  const { data: diviner } = await supabase
    .from("diviners")
    .select("username, is_active")
    .eq("id", divinerId)
    .single();
  console.log("Diviner:", JSON.stringify(diviner, null, 2));
}

run().catch(console.error);
