"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { MapEntity, MapEvent, MapForecast } from "./leaflet-map";

const WorldMapClient = dynamic(
  () =>
    import("@/components/mundane/world-map-client").then(
      (m) => m.WorldMapClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-500" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading map...
        </span>
      </div>
    ),
  }
);

interface WorldMapWrapperProps {
  entities: MapEntity[];
  events: MapEvent[];
  forecasts: MapForecast[];
}

export function WorldMapWrapper(props: WorldMapWrapperProps) {
  return <WorldMapClient {...props} />;
}
