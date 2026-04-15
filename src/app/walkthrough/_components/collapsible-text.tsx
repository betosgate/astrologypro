"use client";

import { useState } from "react";

export function CollapsibleText({
  text,
  maxLines = 4,
  className = "",
}: {
  text: string;
  maxLines?: number;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <p
        className={`text-base leading-relaxed text-muted-foreground font-medium transition-all duration-300 ${
          expanded ? "" : `line-clamp-${maxLines}`
        }`}
        style={expanded ? undefined : { WebkitLineClamp: maxLines, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  );
}
