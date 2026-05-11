import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: diviners, error } = await supabase
    .from("diviners")
    .select("username, is_active")
    .in("username", ["test-diviner-1", "test-diviner-2", "test-diviner-3", "test-diviner-4", "test-diviner-5"]);

  if (error) console.error("Error:", error);
  console.log("Test Diviners:", JSON.stringify(diviners, null, 2));
}

run().catch(console.error);
