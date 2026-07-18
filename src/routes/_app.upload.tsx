import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileDropZone } from "@/components/upload/FileDropZone";
import { useApp } from "@/context/AppContext";
import { emptyReport } from "@/lib/mock";
import { saveReport, saveUpload } from "@/lib/persistence";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, AlertTriangle, CheckCircle2, Play, Sparkles, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload data · Grey Analytics" }] }),
  component: UploadPage,
});

// Siphon Cypher stage only — Transmit Assessment runs on its own page after
// the user explicitly clicks "Analyze" in the success modal.
const STEPS = [
  "Reading the file…",
  "Detecting file format…",
  "Parsing pages and sheets…",
  "Running OCR where needed…",
  "Extracting text with Siphon Cypher…",
] as const;

function UploadPage() {
  const { addUpload, addReport, setExtractedText, user } = useApp();
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Success modal — gates the transition to Transmit Assessment.
  const [done, setDone] = useState<{ reportId: string; chars: number; files: number } | null>(null);

  const addFiles = (incoming: File[]) => {
    setError(null);
    const limit = user?.uploadLimit || 5;
    setFiles((prev) => {
      if (prev.length >= limit) {
        toast.error(`Upload limit reached (${limit} files max for this account).`);
        return prev;
      }
      const key = (f: File) => `${f.name}__${f.size}`;
      const seen = new Set(prev.map(key));
      const merged = [...prev];
      for (const f of incoming) {
        if (merged.length >= limit) {
          toast.error(`Limited to ${limit} files. Upgrade tier or adjust in Settings.`);
          break;
        }
        if (!seen.has(key(f))) merged.push(f);
      }
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

    // Animate all but the final step; the final step is gated on the real
    // extraction call so the progress bar never lies about completion.
    const animated = STEPS.length - 1;
    for (let i = 0; i < animated; i++) {
      setStepIdx(i);
      setProgress(Math.round(((i + 1) / STEPS.length) * 100));
      await new Promise((r) => setTimeout(r, 380));
    }
    setStepIdx(animated);

    try {
      const { extractClientSide, extractServerSide } = await import(
        "@/lib/extract/client"
      );
      const chunks: string[] = [];
      const failures: string[] = [];
      const completed: Array<{ file: File; text: string; uploadId: string; storagePath?: string; contentHash?: string }> = [];
      for (const file of files) {
        // Local parsing keeps supported documents responsive, while the
        // authenticated server call remains authoritative for quota, magic
        // bytes, historical duplicates, private storage and audit linkage.
        const local = await extractClientSide(file);
        const remote = await extractServerSide(file);
        if (remote.ok && remote.uploadId) {
          const text = local.ok ? local.text : remote.text;
          chunks.push(`=== ${file.name} ===\n${text}`);
          completed.push({
            file,
            text,
            uploadId: remote.uploadId,
            storagePath: remote.storagePath,
            contentHash: remote.contentHash,
          });
        }
        else failures.push(`${file.name} (${remote.ok ? "upload-registration-failed" : remote.reason})`);
      }

      if (chunks.length === 0) {
        throw new Error(
          failures.length > 0
            ? `Could not extract text from: ${failures.join(", ")}`
            : "No text could be extracted from the selected files.",
        );
      }

      setProgress(100);

      const r = emptyReport(user?.businessName);
      const text = chunks.join("\n\n");
      // Save the durable audit shell before linking its uploads. Database
      // failures abort the visible success flow instead of being hidden.
      await saveReport(r, {
        status: "extracted",
        extracted_text: text,
        upload_ids: completed.map((entry) => entry.uploadId),
      });
      // Link every server-created upload record to the durable audit shell.
      for (const { file: f, text: extractedText, uploadId, storagePath, contentHash } of completed) {
        const ext = (f.name.split(".").pop() ?? "").toLowerCase();
        const upload = {
          id: uploadId,
          fileName: f.name,
          size: (f.size / 1024 / 1024).toFixed(2) + " MB",
          uploadedAt: new Date(),
          status: "ready",
          source: ext === "pdf" ? "PDF" : ext === "csv" ? "CSV" : ext.startsWith("xls") ? "Excel" : "Image",
          storagePath,
          contentHash,
          mimeType: f.type || null,
          extractedText,
          reportId: r.id,
        } as const;
        await saveUpload(upload);
        addUpload(upload);
      }
      addReport(r);
      setExtractedText(r.id, text);

      toast.success("Text extracted successfully", { description: `${files.length} file(s) processed.` });
      setDone({ reportId: r.id, chars: text.length, files: files.length });
      setRunning(false);
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
                  <div className="size-4 rounded border-2 border-primary animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Siphon Cypher is reading your files…</div>
                  <div className="text-xs text-muted-foreground">
                    Step 1 of 2 — text extraction. The 4-agent analysis runs after this.
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="mb-4" />
              <ol className="space-y-1.5 text-sm">
                {STEPS.map((s, i) => (
                  <li key={s} className={cn("flex items-center gap-2 transition", i > stepIdx && "opacity-30")}>
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
          Originals are stored in private account-scoped storage and transmitted over HTTPS. Use account deletion to remove stored originals and linked audit data.
        </p>
      </div>

      {/* Success modal — gateway to Transmit Assessment. */}
      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="size-12 rounded-full bg-success/10 grid place-items-center mb-3">
              <CheckCircle2 className="size-6 text-success" />
            </div>
            <DialogTitle>Text extracted successfully</DialogTitle>
            <DialogDescription>
              Siphon Cypher pulled {done?.chars.toLocaleString()} characters from {done?.files} file
              {done?.files === 1 ? "" : "s"}. You can now run Transmit Assessment to analyse it with four
              specialist AI agents.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (done) navigate({ to: "/extracted/$id", params: { id: done.reportId } });
                setDone(null);
              }}
            >
              <FileText className="size-4 mr-1.5" />
              View Extracted Data
            </Button>
            <Button
              onClick={() => {
                if (done) navigate({ to: "/analysis/$id", params: { id: done.reportId } });
                setDone(null);
              }}
            >
              <Sparkles className="size-4 mr-1.5" />
              Analyze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
