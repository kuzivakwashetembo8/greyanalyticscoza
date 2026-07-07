// Siphon Cypher — server-side extraction endpoint.
//
// Tech-stack deviations from the original spec (documented per task brief):
//   * The spec suggested `pdf-parse` (Python `pdfplumber` ideal). Neither
//     works on the Cloudflare Workers SSR runtime that TanStack Start ships
//     with: `pdf-parse` relies on Node `fs` and bundled test fixtures, and
//     Python is obviously unavailable. We use `pdfjs-dist`'s legacy ESM
//     build, which is pure-JS and Worker-compatible.
//   * The spec suggested Tesseract for images. Tesseract.js needs WASM +
//     trained-data downloads at runtime and is unreliable inside Workers.
//     We instead call the Lovable AI Gateway with a vision-capable Gemini
//     model — same outcome (raw text from the image) with far better
//     accuracy and no cold-start penalty.
//   * No multer / busboy: we use the standard Web `Request.formData()` API
//     which is natively supported by the Worker runtime.

import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { requireBearer } from "@/lib/api/auth-helpers.server";

const MIN_CHARS = 10;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB cap mirrors the upload UI.
const TIMEOUT_MS = 30_000;

type Json = { success: boolean; text?: string; error?: string };

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function detectKind(name: string, type: string): "pdf" | "csv" | "excel" | "image" | "unknown" {
  const n = name.toLowerCase();
  const t = type.toLowerCase();
  if (t === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (t === "text/csv" || n.endsWith(".csv")) return "csv";
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || t.includes("spreadsheet") || t.includes("excel"))
    return "excel";
  if (t.startsWith("image/")) return "image";
  return "unknown";
}

async function extractPdf(buf: ArrayBuffer): Promise<string> {
  // Legacy ESM build avoids the DOM-only worker shim.
  const pdfjs: typeof import("pdfjs-dist/legacy/build/pdf.mjs") = await import(
    "pdfjs-dist/legacy/build/pdf.mjs"
  );
  // Disable the worker — we're already off the main thread inside the Worker.
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    useWorkerFetch: false,
    useSystemFonts: false,
  }).promise;
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

function extractCsv(text: string): string {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return parsed.data.map((row) => (Array.isArray(row) ? row.join(", ") : String(row))).join("\n");
}

function extractExcel(buf: ArrayBuffer): string {
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    parts.push(`--- Sheet: ${name} ---`);
    parts.push(XLSX.utils.sheet_to_csv(wb.Sheets[name], { FS: "\t" }));
  }
  return parts.join("\n");
}

async function extractImageWithAI(buf: ArrayBuffer, mime: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  // Base64 encode for the data URL the gateway expects.
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  // btoa is available in Workers.
  const b64 = btoa(bin);
  const dataUrl = `data:${mime || "image/png"};base64,${b64}`;

  const prompt =
    "List every piece of information visible in this image that could appear in a business document: text, numbers, dates, amounts, logos, signatures, table contents. Output as a plain text description. Do not add analysis or commentary.";

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function run(file: File): Promise<Json> {
  if (file.size > MAX_BYTES) return { success: false, error: "File exceeds 20MB limit" };
  const kind = detectKind(file.name, file.type);
  if (kind === "unknown") return { success: false, error: "Unsupported file type" };

  try {
    let text = "";
    if (kind === "csv") text = extractCsv(await file.text());
    else if (kind === "excel") text = extractExcel(await file.arrayBuffer());
    else if (kind === "pdf") text = await extractPdf(await file.arrayBuffer());
    else if (kind === "image") text = await extractImageWithAI(await file.arrayBuffer(), file.type);

    text = text.trim();
    if (text.length < MIN_CHARS) return { success: false, error: "Extraction returned no text" };
    return { success: true, text };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}

export const Route = createFileRoute("/api/extract")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await requireBearer(request);
        if (!auth.ok) return auth.response;
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ success: false, error: "Invalid multipart body" }, 400);
        }
        const file = form.get("file");
        if (!(file instanceof File)) {
          return json({ success: false, error: "Missing 'file' field" }, 400);
        }
        const result = await Promise.race<Json>([
          run(file),
          new Promise<Json>((resolve) =>
            setTimeout(() => resolve({ success: false, error: "Extraction timed out" }), TIMEOUT_MS),
          ),
        ]);
        return json(result, result.success ? 200 : 422);
      },
    },
  },
});
