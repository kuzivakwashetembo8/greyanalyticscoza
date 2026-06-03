import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { useApp } from "@/context/AppContext";
import { mockReport } from "@/lib/mock";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { extractClientSide, extractServerSide, detectKind } from "@/lib/extract/client";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload data · Grey Analytics" }] }),
  component: UploadPage,
});

function UploadPage() {
  const { addUpload, addReport, addAlertsFromReport, setExtractedText, user } = useApp();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload your data</h1>
        <p className="text-muted-foreground mt-1">We accept bank statements, Xero or Sage exports, payroll spreadsheets, and even photos of invoices.</p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <FileDropZone
            onComplete={async (files, rawFiles) => {
              files.forEach((f) => {
                const ext = (f.name.split(".").pop() ?? "").toLowerCase();
                addUpload({
                  id: "up_" + Math.random().toString(36).slice(2, 9),
                  fileName: f.name,
                  size: (f.size / 1024 / 1024).toFixed(2) + " MB",
                  uploadedAt: new Date(),
                  status: "ready",
                  source: ext === "pdf" ? "PDF" : ext === "csv" ? "CSV" : ext.startsWith("xls") ? "Excel" : "Image",
                });
              });
              const r = mockReport(user?.businessName);
              addReport(r);
              addAlertsFromReport(r);

              // Siphon Cypher — real extraction runs in parallel with the
              // mock report creation. We keep the user-visible flow identical
              // (animation → report) while extraction continues in the
              // background and populates the "View Input" modal.
              const toastId = toast.loading("Extracting text from your files…");
              try {
                const chunks: string[] = [];
                for (const file of rawFiles) {
                  const kind = detectKind(file);
                  let res = await extractClientSide(file);
                  if (!res.ok) {
                    if (res.reason !== "unsupported") {
                      // Fallback to server (always for images, otherwise on client failure)
                      toast.loading(
                        kind === "image" ? "Reading image with AI vision…" : "Retrying via server…",
                        { id: toastId },
                      );
                      res = await extractServerSide(file);
                    }
                  }
                  if (res.ok) chunks.push(`=== ${file.name} ===\n${res.text}`);
                  else chunks.push(`=== ${file.name} ===\n[Extraction failed: ${res.reason}]`);
                }
                const combined = chunks.join("\n\n");
                if (combined.includes("[Extraction failed")) {
                  toast.warning("Some files could not be extracted", { id: toastId });
                } else {
                  toast.success("Text extracted ✓", { id: toastId });
                }
                if (combined.trim().length > 0) setExtractedText(r.id, combined);
              } catch (err) {
                toast.error("Text extraction failed", {
                  id: toastId,
                  description: err instanceof Error ? err.message : undefined,
                });
              }

              toast.success("Upload complete — report ready", { description: `${files.length} file(s) processed. ${r.leaks.length} leaks detected.` });
              navigate({ to: "/report/$id", params: { id: r.id } });
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 text-sm text-muted-foreground p-4 rounded-lg bg-muted/40 border border-border">
        <ShieldCheck className="size-4 mt-0.5 text-success shrink-0" />
        <p>Your files are encrypted with AES-256 at rest and TLS 1.3 in transit. We delete all data 30 days after offboarding (POPIA).</p>
      </div>
    </div>
  );
}
