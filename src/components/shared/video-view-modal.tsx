"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoViewModalProps {
  videoUrl: string | null;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoViewModal({
  videoUrl,
  title,
  isOpen,
  onClose,
}: VideoViewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black border-none sm:rounded-xl">
        <DialogHeader className="p-4 bg-background border-b">
          <DialogTitle className="truncate pr-8">{title}</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-video w-full flex items-center justify-center bg-black">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="size-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-muted-foreground text-sm">
              No video URL provided.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
