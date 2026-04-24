// /affiliate — redirect to the Dashboard page. The portal's canonical
// dashboard lives at /affiliate/dashboard; this is the short URL people
// type or link to.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AffiliatePortalIndex() {
  redirect("/affiliate/dashboard");
}
