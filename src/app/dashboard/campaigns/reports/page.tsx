import { redirect } from "next/navigation";

/**
 * Campaign Reports has been consolidated into the Campaigns page.
 * The Analytics tab on /dashboard/campaigns shows the same content.
 */
export default function CampaignReportsRedirect() {
  redirect("/dashboard/campaigns");
}
