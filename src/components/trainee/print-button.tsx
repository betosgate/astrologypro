"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useState } from "react";

export function PrintButton() {
  const [printing, setPrinting] = useState(false);

  function handlePrint() {
    setPrinting(true);
    // Small timeout so the state hint renders before print dialog opens
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handlePrint} disabled={printing}>
        <Printer className="mr-2 size-4" />
        {printing ? "Saving as PDF…" : "Download PDF"}
      </Button>
      {printing && (
        <p className="text-xs text-muted-foreground">
          In the print dialog, choose &quot;Save as PDF&quot; as the destination.
        </p>
      )}
    </div>
  );
}
