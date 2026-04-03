"use client";

import dynamic from "next/dynamic";

// Dynamically import PhoneWidget with ssr:false inside a Client Component.
// next/dynamic with ssr:false is only allowed in Client Components (Next.js 16).
const PhoneWidget = dynamic(() => import("./phone-widget"), { ssr: false });

export function PhoneWidgetLoader() {
  return <PhoneWidget />;
}
