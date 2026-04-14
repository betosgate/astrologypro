/**
 * Upload a video file to /api/admin/training/upload with real-time
 * progress tracking via XMLHttpRequest.
 *
 * `fetch()` does not expose upload progress events, so we fall back to
 * XHR which fires `progress` events on `xhr.upload`.
 */

export interface UploadVideoResult {
  url: string;
}

export interface UploadVideoOptions {
  file: File;
  /** Called with a value between 0 and 100 as bytes are sent. */
  onProgress?: (percent: number) => void;
  /** Called when the upload phase changes. */
  onStatus?: (status: string) => void;
  /** Optional AbortSignal to cancel the upload. */
  signal?: AbortSignal;
}

function friendlyUploadError(status: number, responseText: string) {
  let serverMessage = "";
  try {
    const body = JSON.parse(responseText);
    if (typeof body.error === "string") serverMessage = body.error;
  } catch {
    serverMessage = responseText;
  }

  const isStorageLimit =
    status === 413 ||
    serverMessage.includes("file_size_limit") ||
    serverMessage.includes("Payload too large") ||
    serverMessage.includes("exceeded the maximum allowed size");

  if (isStorageLimit) {
    return "This video is larger than the current storage upload limit. Please upload a smaller or compressed video, or ask an admin to increase the training video storage limit.";
  }

  if (serverMessage.trim()) {
    return serverMessage.trim();
  }

  return `Upload failed (HTTP ${status}). Please try again.`;
}

export function uploadTrainingVideo({
  file,
  onProgress,
  onStatus,
  signal,
}: UploadVideoOptions): Promise<UploadVideoResult> {
  return new Promise<UploadVideoResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    onProgress?.(0);
    onStatus?.("Preparing upload…");

    // --- progress ---
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        // Browser upload progress only tracks client -> app server transfer.
        // Keep headroom for the server-side Supabase Storage write.
        const percent = Math.min(95, Math.round((e.loaded / e.total) * 95));
        onProgress(percent);
      }
    });

    xhr.upload.addEventListener("load", () => {
      onProgress?.(95);
      onStatus?.("Processing video…");
    });

    // --- completion ---
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          onProgress?.(100);
          onStatus?.("Upload complete.");
          resolve({ url: json.url });
        } catch {
          reject(new Error("Invalid JSON response from upload endpoint."));
        }
      } else {
        reject(new Error(friendlyUploadError(xhr.status, xhr.responseText)));
      }
    });

    // --- network error ---
    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload. Please check your connection and try again."));
    });

    // --- timeout ---
    xhr.addEventListener("timeout", () => {
      reject(new Error("Upload timed out. The file may be too large for your connection speed."));
    });

    // --- abort ---
    xhr.addEventListener("abort", () => {
      reject(new Error("Upload cancelled."));
    });

    // Wire up AbortSignal if provided.
    if (signal) {
      if (signal.aborted) {
        reject(new Error("Upload cancelled."));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    // 5 minute timeout — matches the server-side maxDuration = 300.
    xhr.timeout = 5 * 60 * 1000;

    const body = new FormData();
    body.append("file", file);

    xhr.open("POST", "/api/admin/training/upload");
    xhr.send(body);
  });
}
