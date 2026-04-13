"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import phone widgets with ssr:false inside a Client Component.
// next/dynamic with ssr:false is only allowed in Client Components (Next.js 16).
const PhoneWidget = dynamic(() => import("./phone-widget"), { ssr: false });
const ChimePhoneWidget = dynamic(
  () =>
    import("./chime-phone-widget").then((m) => ({
      default: m.ChimePhoneWidget,
    })),
  { ssr: false }
);

export function PhoneWidgetLoader() {
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    // Fetch diviner's phone provider preference
    fetch("/api/dashboard/provider-preference")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setProvider(data?.phoneProvider ?? "twilio");
      })
      .catch(() => setProvider("twilio"));
  }, []);

  if (!provider) return null;

  if (provider === "chime") {
    return <ChimePhoneWidget />;
  }

  return <PhoneWidget />;
}
