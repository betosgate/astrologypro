"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { TestimonialForm } from "./testimonial-form";

interface TestimonialDialogProps {
  divinerId: string;
  divinerName: string;
  serviceType: string;
  bookingId: string;
}

export function TestimonialDialog({
  divinerId,
  divinerName,
  serviceType,
  bookingId,
}: TestimonialDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Star className="mr-1 size-3" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>
        <TestimonialForm
          divinerId={divinerId}
          divinerName={divinerName}
          serviceType={serviceType}
          bookingId={bookingId}
          onSuccess={() => setTimeout(() => setOpen(false), 2000)}
        />
      </DialogContent>
    </Dialog>
  );
}
