import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { useApp } from "@/context/AppContext";
import { mockReport } from "@/lib/mock";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload data · Grey Analytics" }] }),
  component: UploadPage,
});

// Loading sequence — extraction is the FINAL step per the refined brief.
const STEPS = [
  "Reading the file…",
  "Connecting to Xero…",
  "Scanning transactions for duplicates…",
  "Finance agent analysing…",
  "Compliance agent checking VAT & COIDA…",
  "Ops agent reviewing payroll cycles…",
  "Strategy agent estimating ROI…",
  "Extracting text with Siphon Cypher…",
] as const;

function UploadPage() {
  const { addUpload, addReport, addAlertsFromReport, setExtractedText, user } = useApp();
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (incoming: File[]) => {
    setError(null);
    setFiles((prev) => {
      const key = (f: File) => `${f.name}__${f.size}`;
      const seen = new Set(prev.map(key));
      const merged = [...prev];
      for (const f of incoming) if (!seen.has(key(f))) merged.push(f);
      return merged;
    });
  };

  const removeFile = (name: string, size: number) => {
    setFiles((prev) => prev.filter((f) => !(f.name === name && f.size === size)));
  };

  const start = async () => {
    if (files.length === 0 || running) return;
    setRunning(true);
    setError(null);
    setStepIdx(0);
    setProgress(0);

    // Animate steps 0..(STEPS.length - 2). The final step (extraction) is
    // gated on the real extraction call below so the UI cannot reach 100%
    // until extraction actually completes (or fails).
    const animatedSteps = STEPS.length - 1;
    const perStepMs = 450;
    for (let i = 0; i < animatedSteps; i++) {
      setStepIdx(i);
      setProgress(Math.round(((i + 1) / STEPS.length) * 100));
      await new Promise((r) => setTimeout(r, perStepMs));
    }

    // Final step — REAL Siphon Cypher extraction. Dynamic import keeps
    // pdfjs / xlsx out of the SSR module graph (defensive against the
    // recent "SSR rendering failed" runtime error).
    setStepIdx(animatedSteps);
    try {
      const { extractClientSide, extractServerSide, detectKind } = await import(
        "@/lib/extract/client"
      );
      const chunks: string[] = [];
      const failures: string[] = [];
      for (const file of files) {
        const kind = detectKind(file);
        let res = await extractClientSide(file);
        if (!res.ok && res.reason !== "unsupported") {
          // Images always go to server; client failures fall back to server.
          res =
            kind === "image" || res.reason === "image-needs-server"
              ? await extractServerSide(file)
              : await extractServerSide(file);
        }
        if (res.ok) chunks.push(`=== ${file.name} ===\n${res.text}`);
        else failures.push(`${file.name} (${res.reason})`);
      }

      if (chunks.length === 0) {
        throw new Error(
          failures.length > 0
            ? `Could not extract text from: ${failures.join(", ")}`
            : "No text could be extracted from the selected files.",
        );
      }

      setProgress(100);

      // Success — register upload artefacts, mock report and alerts.
      files.forEach((f) => {
        const ext = (f.name.split(".").pop() ?? "").toLowerCase();
        addUpload({
          id: "up_" + Math.random().toString(36).slice(2, 9),
          fileName: f.name,
          size: (f.size / 1024 / 1024).toFixed(2) + " MB",
          uploadedAt: new Date(),
          status: "ready",
          source:
            ext === "pdf" ? "PDF" : ext === "csv" ? "CSV" : ext.startsWith("xls") ? "Excel" : "Image",
        });
      });
      const r = mockReport(user?.businessName);
      addReport(r);
      addAlertsFromReport(r);
      setExtractedText(r.id, chunks.join("\n\n"));

      toast.success("Upload complete — report ready", {
        description: `${files.length} file(s) processed. ${r.leaks.length} leaks detected.`,
      });
      navigate({ to: "/report/$id", params: { id: r.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Text extraction failed.";
      setError(msg);
      toast.error("Extraction failed", { description: msg });
      setRunning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Upload your data</h1>
        <p className="text-muted-foreground mt-1">
          We accept bank statements, Xero or Sage exports, payroll spreadsheets, and even photos of invoices.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <FileDropZone files={files} onAdd={addFiles} onRemove={removeFile} disabled={running} />

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Extraction failed</AlertTitle>
              <AlertDescription>{error} You can adjust your files and try again.</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {files.length === 0
                ? "Add one or more files to get started."
                : `${files.length} file${files.length === 1 ? "" : "s"} ready.`}
            </p>
            <Button onClick={start} disabled={files.length === 0 || running} size="lg">
              <Play className="size-4 mr-1.5" />
              {running ? "Working…" : error ? "Retry" : "Start"}
            </Button>
          </div>

          {running && (
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-full bg-primary/10 grid place-items-center pulse-ring">
                  <div className="size-3 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Grey Analytics is working…</div>
                  <div className="text-xs text-muted-foreground">
                    Four AI agents are checking your data. Text extraction runs last.
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="mb-4" />
              <ol className="space-y-1.5 text-sm">
                {STEPS.map((s, i) => (
                  <li
                    key={s}
                    className={cn("flex items-center gap-2 transition", i > stepIdx && "opacity-30")}
                  >
                    {i < stepIdx ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : i === stepIdx ? (
                      <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : (
                      <div className="size-4 rounded-full border border-border" />
                    )}
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 text-sm text-muted-foreground p-4 rounded-lg bg-muted/40 border border-border">
        <ShieldCheck className="size-4 mt-0.5 text-success shrink-0" />
        <p>
          Your files are encrypted with AES-256 at rest and TLS 1.3 in transit. We delete all data 30 days after
          offboarding (POPIA).
        </p>
      </div>
    </div>
  );
}
