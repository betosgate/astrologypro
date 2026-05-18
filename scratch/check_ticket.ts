import { createAdminClient } from "../src/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();
  const ticketId = "b0e8e36e-8c9e-40a7-be6f-ed2c095169f9";

  const { data: ticket, error: ticketError } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (ticketError) {
    console.error("Ticket Fetch Error:", ticketError);
    return;
  }
  
  console.log("=== TICKET ===");
  console.log(JSON.stringify(ticket, null, 2));

  const { data: messages, error: msgError } = await admin
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (msgError) {
    console.error("Messages Fetch Error:", msgError);
    return;
  }

  console.log("\n=== MESSAGES ===");
  console.log(JSON.stringify(messages, null, 2));
}

main().catch(console.error);
