/**
 * Minimal AWS event-stream codec for AWS Transcribe Streaming.
 *
 * Wire format per message:
 *   [4] total byte length
 *   [4] headers byte length
 *   [4] CRC32 of the 8-byte prelude
 *   [N] headers  (sequence of: 1-byte name-len | name | 1-byte value-type=7 | 2-byte value-len | value)
 *   [M] payload
 *   [4] CRC32 of everything before this field
 */

// ── CRC32 ─────────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── Header encoding ───────────────────────────────────────────────────────────
const enc = new TextEncoder();

function encodeHeader(name: string, value: string): Uint8Array {
  const n = enc.encode(name);
  const v = enc.encode(value);
  const buf = new Uint8Array(1 + n.length + 1 + 2 + v.length);
  let o = 0;
  buf[o++] = n.length;
  buf.set(n, o); o += n.length;
  buf[o++] = 7; // string type
  new DataView(buf.buffer).setUint16(o, v.length); o += 2;
  buf.set(v, o);
  return buf;
}

// ── Encode an AudioEvent message ─────────────────────────────────────────────
export function encodeAudioEvent(pcm: ArrayBuffer): ArrayBuffer {
  const h1 = encodeHeader(":event-type", "AudioEvent");
  const h2 = encodeHeader(":content-type", "application/octet-stream");
  const h3 = encodeHeader(":message-type", "event");

  const headerLen = h1.length + h2.length + h3.length;
  const payloadLen = pcm.byteLength;
  const totalLen = 4 + 4 + 4 + headerLen + payloadLen + 4;

  const buf = new ArrayBuffer(totalLen);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  view.setUint32(0, totalLen);
  view.setUint32(4, headerLen);
  view.setUint32(8, crc32(new Uint8Array(buf, 0, 8)));

  let o = 12;
  bytes.set(h1, o); o += h1.length;
  bytes.set(h2, o); o += h2.length;
  bytes.set(h3, o); o += h3.length;
  bytes.set(new Uint8Array(pcm), o);

  view.setUint32(totalLen - 4, crc32(new Uint8Array(buf, 0, totalLen - 4)));
  return buf;
}

// ── Decode a TranscriptEvent response ────────────────────────────────────────
export interface TranscriptChunk {
  text: string;
  isPartial: boolean;
}

let _decodeLogCount = 0;

export function decodeTranscriptEvent(data: ArrayBuffer): TranscriptChunk | null {
  try {
    const view = new DataView(data);
    const totalLen = view.getUint32(0);
    const headerLen = view.getUint32(4);

    // Parse ALL headers
    let o = 12;
    const headers: Record<string, string> = {};
    while (o < 12 + headerLen) {
      const nameLen = view.getUint8(o++);
      const name = new TextDecoder().decode(new Uint8Array(data, o, nameLen)); o += nameLen;
      const vType = view.getUint8(o++);
      if (vType === 7) {
        // String type
        const vLen = view.getUint16(o); o += 2;
        const value = new TextDecoder().decode(new Uint8Array(data, o, vLen)); o += vLen;
        headers[name] = value;
      } else if (vType === 0) {
        // Bool true
        headers[name] = "true";
      } else if (vType === 1) {
        // Bool false
        headers[name] = "false";
      } else if (vType === 2) {
        // Byte
        headers[name] = String(view.getUint8(o)); o += 1;
      } else if (vType === 3) {
        // Short
        headers[name] = String(view.getInt16(o)); o += 2;
      } else if (vType === 4) {
        // Int
        headers[name] = String(view.getInt32(o)); o += 4;
      } else if (vType === 5) {
        // Long
        o += 8;
        headers[name] = "[long]";
      } else if (vType === 6) {
        // Bytes
        const vLen = view.getUint16(o); o += 2;
        o += vLen;
        headers[name] = `[bytes:${vLen}]`;
      } else if (vType === 8) {
        // Timestamp
        o += 8;
        headers[name] = "[timestamp]";
      } else if (vType === 9) {
        // UUID
        o += 16;
        headers[name] = "[uuid]";
      } else {
        // Unknown — stop parsing to avoid infinite loop
        break;
      }
    }

    const eventType = headers[":event-type"] ?? "";
    const messageType = headers[":message-type"] ?? "";
    const exceptionType = headers[":exception-type"] ?? "";

    // Log first few messages for debugging
    if (_decodeLogCount < 10) {
      console.log(`[transcribe] headers:`, headers);
      _decodeLogCount++;
    }

    // Handle exception messages from Transcribe
    if (messageType === "exception" || exceptionType) {
      const payloadStart = 12 + headerLen;
      const payloadLen = totalLen - payloadStart - 4;
      if (payloadLen > 0) {
        const errText = new TextDecoder().decode(new Uint8Array(data, payloadStart, payloadLen));
        console.error(`[transcribe] Exception: ${exceptionType}`, errText);
      }
      return null;
    }

    if (eventType !== "TranscriptEvent") return null;

    const payloadStart = 12 + headerLen;
    const payloadLen = totalLen - payloadStart - 4;
    const payloadText = new TextDecoder().decode(new Uint8Array(data, payloadStart, payloadLen));

    if (_decodeLogCount < 15) {
      console.log(`[transcribe] payload:`, payloadText.slice(0, 300));
      _decodeLogCount++;
    }

    const json = JSON.parse(payloadText);

    const results: any[] = json?.Transcript?.Results ?? [];
    if (!results.length) return null;

    const result = results[0];
    const text: string = result?.Alternatives?.[0]?.Transcript ?? "";
    if (!text) return null;

    return { text, isPartial: Boolean(result.IsPartial) };
  } catch (err) {
    if (_decodeLogCount < 10) {
      console.error("[transcribe] decode error:", err);
      _decodeLogCount++;
    }
    return null;
  }
}

// ── Float32 PCM → Int16 PCM ───────────────────────────────────────────────────
export function floatToPcm16(float32: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}
