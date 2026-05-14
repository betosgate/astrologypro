import { createAdminClient } from "@/lib/supabase/admin";

interface TicketNotificationOptions {
  ticketId: string;
  subject: string;
  priority: string;
  category: string;
  creatorEmail?: string;
}

/**
 * Sends notifications for new or escalated tickets.
 */
export async function notifyStaffOfTicket(options: TicketNotificationOptions) {
  const { ticketId, subject, priority, category } = options;

  // Logic for Slack/Email would go here.
  // For now, we'll log it and potentially insert into a notifications table if one exists.
  console.log(`[Notification] New Ticket: ${subject} (${priority}) - ${category}`);

  const admin = createAdminClient();

  // If priority is 'critical' or 'urgent', we might want to do more.
  if (["critical", "urgent"].includes(priority.toLowerCase())) {
    // Example: Insert into a staff_alerts table
    try {
      await admin.from("staff_alerts").insert({
        type: "ticket_escalation",
        title: `CRITICAL TICKET: ${subject}`,
        message: `A critical ticket has been opened in ${category}.`,
        metadata: { ticket_id: ticketId, priority }
      });
    } catch (err) {
      console.error("Failed to insert staff alert:", err);
    }
  }
}
