function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "");
}

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) {
        lines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function splitIntoPages(text: string) {
  const rawLines = text
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return [""];
      }
      return wrapText(trimmed, 92);
    });

  const pages: string[][] = [];
  const linesPerPage = 44;
  for (let i = 0; i < rawLines.length; i += linesPerPage) {
    pages.push(rawLines.slice(i, i + linesPerPage));
  }
  return pages.length > 0 ? pages : [[""]];
}

export function buildSimplePdfDocument(text: string) {
  const pages = splitIntoPages(text);
  const objects: string[] = [];

  objects.push("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj");

  const kids = pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ");
  objects.push(`2 0 obj << /Type /Pages /Count ${pages.length} /Kids [${kids}] >> endobj`);

  pages.forEach((pageLines, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    const streamLines = [
      "BT",
      "/F1 10 Tf",
      "50 790 Td",
      "14 TL",
    ];

    for (const line of pageLines) {
      if (!line) {
        streamLines.push("T*");
        continue;
      }
      streamLines.push(`(${escapePdfText(line)}) Tj`);
      streamLines.push("T*");
    }
    streamLines.push("ET");

    const stream = streamLines.join("\n");

    objects.push(
      `${pageObjectId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >> endobj`,
    );
    objects.push(
      `${contentObjectId} 0 obj << /Length ${Buffer.byteLength(stream, "utf8")} >> stream\n${stream}\nendstream endobj`,
    );
  });

  const fontObjectId = 3 + pages.length * 2;
  objects.push(`${fontObjectId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
