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

export function decodeTranscriptEvent(data: ArrayBuffer): TranscriptChunk | null {
  try {
    const view = new DataView(data);
    const totalLen = view.getUint32(0);
    const headerLen = view.getUint32(4);

    // Parse headers to find :event-type
    let o = 12;
    let eventType = "";
    while (o < 12 + headerLen) {
      const nameLen = view.getUint8(o++);
      const name = new TextDecoder().decode(new Uint8Array(data, o, nameLen)); o += nameLen;
      const vType = view.getUint8(o++);
      if (vType === 7) {
        const vLen = view.getUint16(o); o += 2;
        const value = new TextDecoder().decode(new Uint8Array(data, o, vLen)); o += vLen;
        if (name === ":event-type") eventType = value;
      }
    }

    if (eventType !== "TranscriptEvent") return null;

    const payloadStart = 12 + headerLen;
    const payloadLen = totalLen - payloadStart - 4;
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, payloadStart, payloadLen)));

    const results: any[] = json?.Transcript?.Results ?? [];
    if (!results.length) return null;

    const result = results[0];
    const text: string = result?.Alternatives?.[0]?.Transcript ?? "";
    if (!text) return null;

    return { text, isPartial: Boolean(result.IsPartial) };
  } catch {
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
