// Siphon Cypher — client-side text extraction.
// Runs in the browser for PDF / CSV / Excel. Images are always escalated
// to the server route. If client extraction throws or produces fewer than
// MIN_CHARS characters, callers should fall back to /api/extract.
//
// NOTE: We use pdfjs-dist's legacy build and Vite's `?url` import for the
// worker, which is the recommended pattern for Vite/Cloudflare Workers
// front-ends (avoids bundling the worker inline and keeps the main thread
// responsive). The original spec mentioned "a more modern wrapper" — the
// official pdfjs-dist legacy ESM build is the most reliable choice today.

import Papa from "papaparse";
import * as XLSX from "xlsx";

export const MIN_CHARS = 10;

export type ExtractResult = { ok: true; text: string } | { ok: false; reason: string };

export function detectKind(file: File): "pdf" | "csv" | "excel" | "image" | "unknown" {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (type === "text/csv" || name.endsWith(".csv")) return "csv";
  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    type.includes("spreadsheet") ||
    type.includes("excel")
  )
    return "excel";
  if (type.startsWith("image/")) return "image";
  return "unknown";
}

async function extractCsv(file: File): Promise<string> {
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return parsed.data.map((row) => (Array.isArray(row) ? row.join(", ") : String(row))).join("\n");
}

async function extractExcel(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    parts.push(`--- Sheet: ${name} ---`);
    const sheet = wb.Sheets[name];
    parts.push(XLSX.utils.sheet_to_csv(sheet, { FS: "\t" }));
  }
  return parts.join("\n");
}

async function extractPdf(file: File): Promise<string> {
  // Dynamic import keeps pdfjs out of the initial bundle.
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker URL (avoids "fake worker" warning + slow main-thread parsing).
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ");
    pages.push(`--- Page ${i} ---\n${text}`);
  }
  return pages.join("\n\n");
}

export async function extractClientSide(file: File): Promise<ExtractResult> {
  const kind = detectKind(file);
  if (kind === "image") return { ok: false, reason: "image-needs-server" };
  if (kind === "unknown") return { ok: false, reason: "unsupported" };
  try {
    let text = "";
    if (kind === "csv") text = await extractCsv(file);
    else if (kind === "excel") text = await extractExcel(file);
    else if (kind === "pdf") text = await extractPdf(file);
    text = text.trim();
    if (text.length < MIN_CHARS) return { ok: false, reason: "insufficient-text" };
    return { ok: true, text };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "client-extract-failed" };
  }
}

export async function extractServerSide(file: File): Promise<ExtractResult> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  try {
    const res = await fetch("/api/extract", { method: "POST", body: fd });
    const json = (await res.json()) as { success: boolean; text?: string; error?: string };
    if (json.success && json.text && json.text.trim().length >= MIN_CHARS) {
      return { ok: true, text: json.text };
    }
    return { ok: false, reason: json.error ?? "server-extract-failed" };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "network-error" };
  }
}

export async function extractWithFallback(file: File): Promise<ExtractResult> {
  const client = await extractClientSide(file);
  if (client.ok) return client;
  return extractServerSide(file);
}
