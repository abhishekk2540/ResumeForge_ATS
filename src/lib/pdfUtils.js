// ── PDF Utilities: Local parsing with pdfjs-dist ──

import * as pdfjsLib from "pdfjs-dist";

// Configure worker from CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Parse a PDF file and extract text with bounding boxes + render pages to canvas data URLs.
 * @param {File} file - The PDF file
 * @returns {{ pages: Array<{ dataUrl: string, width: number, height: number, lineBoxes: Array<{ text: string, x: number, y: number, width: number, height: number }> }>, fullText: string }}
 */
export async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  let fullText = "";
  const scale = 2; // High-res rendering

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    // Render to canvas
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/png");

    // Extract text items with positions
    const textContent = await page.getTextContent();
    const items = textContent.items.filter((item) => item.str.trim().length > 0);

    // Group items into lines based on Y position (tolerance)
    const lineMap = new Map();
    const tolerance = 3;

    for (const item of items) {
      const tx = item.transform;
      // transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const x = tx[4] * scale;
      const y = viewport.height - tx[5] * scale; // Flip Y
      const fontSize = Math.abs(tx[3]) * scale;
      const width = item.width * scale;

      // Find or create line group
      let foundLine = null;
      for (const [key] of lineMap) {
        if (Math.abs(key - y) < tolerance) {
          foundLine = key;
          break;
        }
      }

      const lineKey = foundLine !== null ? foundLine : y;
      if (!lineMap.has(lineKey)) {
        lineMap.set(lineKey, { items: [], y: lineKey, fontSize });
      }
      lineMap.get(lineKey).items.push({ text: item.str, x, width });
    }

    // Convert line groups to lineBoxes
    const lineBoxes = [];
    for (const [, line] of lineMap) {
      const texts = line.items
        .sort((a, b) => a.x - b.x)
        .map((it) => it.text)
        .join(" ");
      const minX = Math.min(...line.items.map((it) => it.x));
      const maxX = Math.max(
        ...line.items.map((it) => it.x + it.width)
      );
      const height = line.fontSize * 1.3;

      lineBoxes.push({
        text: texts,
        x: minX,
        y: line.y - line.fontSize,
        width: maxX - minX,
        height,
      });

      fullText += texts + "\n";
    }

    pages.push({
      dataUrl,
      width: viewport.width,
      height: viewport.height,
      lineBoxes: lineBoxes.sort((a, b) => a.y - b.y),
    });
  }

  return { pages, fullText: fullText.trim() };
}
