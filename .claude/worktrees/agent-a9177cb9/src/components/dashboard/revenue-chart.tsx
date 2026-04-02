"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

interface MonthlyData {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  monthlyData: MonthlyData[];
}

export function RevenueChart({ monthlyData }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...monthlyData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2" style={{ height: 180 }}>
        {monthlyData.map((data, index) => {
          const heightPercent = (data.revenue / maxRevenue) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={data.month}
              className="relative flex flex-1 flex-col items-center justify-end"
              style={{ height: "100%" }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchStart={() => setHoveredIndex(index)}
              onTouchEnd={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-8 z-10 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md border">
                  {formatCurrency(data.revenue / 100)}
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-md bg-primary transition-all duration-500 ease-out hover:bg-primary/80"
                style={{
                  height: `${Math.max(heightPercent, 2)}%`,
                  opacity: isHovered ? 1 : 0.85,
                  animationDelay: `${index * 100}ms`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-2">
        {monthlyData.map((data) => (
          <div
            key={data.month}
            className="flex-1 text-center text-xs text-muted-foreground"
          >
            {data.month}
          </div>
        ))}
      </div>
    </div>
  );
}
