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
import { requireRateLimit } from "@/lib/api/rate-limit.server";
import { logServerError } from "@/lib/api/monitoring.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MIN_CHARS = 10;
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB cap mirrors the upload UI.
const TIMEOUT_MS = 30_000;

type Json = { success: boolean; text?: string; error?: string; storage_path?: string };

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

// Magic-byte sniffer — reject files whose real content doesn't match a
// supported category, even when the filename or MIME lies.
function sniffKind(buf: Uint8Array): "pdf" | "image" | "office" | "csv" | "unknown" {
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "pdf"; // %PDF
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return "office"; // ZIP / xlsx
  if (buf.length >= 8 && buf[0] === 0xd0 && buf[1] === 0xcf && buf[2] === 0x11 && buf[3] === 0xe0) return "office"; // legacy xls
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image"; // jpg
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image"; // png
  if (buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return "image"; // gif
  if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image"; // webp
  // Simple heuristic: mostly printable ASCII → treat as CSV/text.
  const sample = buf.slice(0, Math.min(buf.length, 512));
  let printable = 0;
  for (const b of sample) if ((b >= 0x20 && b < 0x7f) || b === 0x09 || b === 0x0a || b === 0x0d) printable++;
  if (printable / Math.max(1, sample.length) > 0.9) return "csv";
  return "unknown";
}

async function run(file: File): Promise<Json> {
  if (file.size > MAX_BYTES) return { success: false, error: "File exceeds 20MB limit" };
  const kind = detectKind(file.name, file.type);
  if (kind === "unknown") return { success: false, error: "Unsupported file type" };

  try {
    // Sniff the real bytes; refuse mismatches (defence against a renamed .exe).
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const sniffed = sniffKind(bytes);
    const compatible =
      (kind === "pdf" && sniffed === "pdf") ||
      (kind === "excel" && sniffed === "office") ||
      (kind === "csv" && (sniffed === "csv" || sniffed === "office")) ||
      (kind === "image" && sniffed === "image");
    if (!compatible) {
      return { success: false, error: "File contents do not match its extension" };
    }

    let text = "";
    if (kind === "csv") text = extractCsv(new TextDecoder().decode(bytes));
    else if (kind === "excel") text = extractExcel(buf);
    else if (kind === "pdf") text = await extractPdf(buf);
    else if (kind === "image") text = await extractImageWithAI(buf, file.type);

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
        // 30 extractions / 10 minutes per user.
        const rl = await requireRateLimit(auth.userId, "extract", 30, 10);
        if (!rl.allowed) return rl.response;

        // Enforce the user's upload quota — the browser also honours this but
        // an attacker can trivially bypass client-side limits.
        const { data: profile } = await supabaseAdmin
          .from("profiles").select("upload_limit").eq("id", auth.userId).maybeSingle();
        const limit = profile?.upload_limit ?? 5;
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabaseAdmin
          .from("uploads").select("id", { count: "exact", head: true })
          .eq("user_id", auth.userId).gte("created_at", since);
        if ((count ?? 0) >= limit) {
          return json({
            success: false,
            error: `Daily upload quota reached (${limit}). Update the limit in Settings.`,
          }, 429);
        }

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
        if (!result.success) {
          await logServerError(auth.userId, "extract", { message: result.error });
        } else {
          // Best-effort: persist the original bytes to the private
          // `original-documents` bucket under the caller's uid/ prefix.
          // Failure to upload does not block returning the extracted text.
          try {
            const path = `${auth.userId}/${Date.now()}-${(file as File).name.replace(/[^\w.\-]/g, "_")}`;
            const { error: upErr } = await supabaseAdmin.storage
              .from("original-documents")
              .upload(path, file, {
                contentType: (file as File).type || "application/octet-stream",
                upsert: false,
              });
            if (upErr) {
              console.warn("[extract] storage upload failed:", upErr.message);
            } else {
              (result as Json & { storage_path?: string }).storage_path = path;
            }
          } catch (err) {
            console.warn("[extract] storage upload exception:", err);
          }
        }
        return json(result, result.success ? 200 : 422);
      },
    },
  },
});
