function toWholeMinutes(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}

function loadDurationFromVideoSource(src: string, revokeObjectUrl = false) {
  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      if (revokeObjectUrl) {
        URL.revokeObjectURL(src);
      }
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 15000);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    video.onloadedmetadata = () => {
      window.clearTimeout(timeout);
      const minutes = toWholeMinutes(video.duration);
      cleanup();
      resolve(minutes);
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      cleanup();
      resolve(null);
    };

    video.src = src;
  });
}

export async function getDurationMinsFromFile(file: File) {
  const objectUrl = URL.createObjectURL(file);
  return loadDurationFromVideoSource(objectUrl, true);
}

export async function getDurationMinsFromUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) return null;
  return loadDurationFromVideoSource(trimmed);
}
