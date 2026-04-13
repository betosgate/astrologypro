"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/landing/service-card";

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  duration_minutes: number;
  base_price: number;
  category: string;
  is_featured: boolean;
  [key: string]: unknown;
}

interface ServiceTabsProps {
  astroServices: Service[];
  tarotServices: Service[];
  username: string;
  serviceImages: Record<string, string | null>;
  refParam?: string;
}

export function ServiceTabs({
  astroServices,
  tarotServices,
  username,
  serviceImages,
  refParam = "",
}: ServiceTabsProps) {
  return (
    <Tabs defaultValue="astrology" className="w-full">
      <div className="mb-8 flex justify-center">
        <TabsList className="border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <TabsTrigger
            value="astrology"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            Astrology
            <span className="ml-1 text-xs opacity-60">
              ({astroServices.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="tarot"
            className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold"
          >
            Tarot
            <span className="ml-1 text-xs opacity-60">
              ({tarotServices.length})
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="astrology">
        <div className="grid gap-5 sm:grid-cols-2">
          {astroServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={username}
              imageUrl={serviceImages[service.slug]}
              refParam={refParam}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="tarot">
        <div className="grid gap-5 sm:grid-cols-2">
          {tarotServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              username={username}
              imageUrl={serviceImages[service.slug]}
              refParam={refParam}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
