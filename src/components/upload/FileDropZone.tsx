import { useCallback, useRef, useState } from "react";
import { Upload as UploadIcon, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type SelectedFile = { name: string; size: number; type: string };

interface Props {
  onComplete: (files: SelectedFile[], rawFiles: File[]) => void;
}

const STEPS = [
  "Reading the file…",
  "Connecting to Xero…",
  "Scanning transactions for duplicates…",
  "Finance agent analysing…",
  "Compliance agent checking VAT & COIDA…",
  "Ops agent reviewing payroll cycles…",
  "Strategy agent estimating ROI…",
  "Generating plain-English report…",
];

export function FileDropZone({ onComplete }: Props) {
  const [drag, setDrag] = useState(false);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<"idle" | "uploading" | "processing" | "done">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const raw = Array.from(fileList);
    const list = raw.map((f) => ({ name: f.name, size: f.size, type: f.type }));
    setFiles(list);
    setStage("uploading");
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / 2000) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else {
        setStage("processing");
        let i = 0;
        setStepIdx(0);
        const stepTimer = setInterval(() => {
          i += 1;
          if (i >= STEPS.length) {
            clearInterval(stepTimer);
            setStage("done");
            setTimeout(() => onComplete(list, raw), 600);
          } else {
            setStepIdx(i);
          }
        }, 500);
      }
    };
    requestAnimationFrame(tick);
  }, [onComplete]);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => stage === "idle" && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && stage === "idle") inputRef.current?.click(); }}
        role="button"
        tabIndex={stage === "idle" ? 0 : -1}
        aria-label="Upload file area"
        className={cn(
          "border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition cursor-pointer",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          stage !== "idle" && "cursor-default",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.xlsx,.xls,image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
          aria-label="File input"
        />
        <div className="size-14 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center mb-4">
          <UploadIcon className="size-6" />
        </div>
        <h3 className="text-base font-semibold">Drop your files here</h3>
        <p className="text-sm text-muted-foreground mt-1">PDF · CSV · Excel · Photos of invoices (max 20 MB each)</p>
        <Button type="button" variant="outline" className="mt-4" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} disabled={stage !== "idle"}>
          Choose files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.name} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <FileText className="size-5 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              {stage === "done" ? <CheckCircle2 className="size-5 text-success" /> : null}
            </div>
          ))}
        </div>
      )}

      {stage === "uploading" && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span>Uploading</span><span className="tabular-nums">{Math.round(progress)}%</span></div>
          <Progress value={progress} />
        </div>
      )}

      {stage === "processing" && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary/10 grid place-items-center pulse-ring">
              <div className="size-3 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <div className="font-semibold">Grey Analytics is working…</div>
              <div className="text-xs text-muted-foreground">Four AI agents are checking your data.</div>
            </div>
          </div>
          <ol className="space-y-1.5 text-sm">
            {STEPS.map((s, i) => (
              <li key={s} className={cn("flex items-center gap-2 transition", i > stepIdx && "opacity-30")}>
                {i < stepIdx ? <CheckCircle2 className="size-4 text-success" /> :
                  i === stepIdx ? <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" /> :
                  <div className="size-4 rounded-full border border-border" />}
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
