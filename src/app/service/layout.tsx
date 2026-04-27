import { RouteTracker } from "@/components/shared/route-tracker";

export const metadata = {
  title: "Service - AstrologyPro",
};

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <RouteTracker href="/service" />
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
