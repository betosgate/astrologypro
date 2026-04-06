import { cn } from "@/lib/utils";

interface CircularProgressProps {
  percentage: number; // 0–100
  size?: number; // px, default 80
  strokeWidth?: number; // default 7
  color?: string; // Tailwind stroke class or hex, default uses primary
  className?: string;
  showLabel?: boolean;
}

export function CircularProgress({
  percentage,
  size = 80,
  strokeWidth = 7,
  color,
  className,
  showLabel = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clampedPct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-primary/20"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={color ?? "stroke-primary"}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold tabular-nums leading-none">
          {clampedPct}%
        </span>
      )}
    </div>
  );
}
