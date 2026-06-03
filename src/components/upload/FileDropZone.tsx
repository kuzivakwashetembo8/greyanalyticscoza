// FileDropZone — selection-only component.
// Per the refined Siphon Cypher brief, this component NO LONGER triggers
// extraction or the processing animation. It is now purely a controlled file
// picker: the parent owns the selected-files list and decides when (and how)
// to start extraction via an explicit "Start" button. This also removes any
// risk of side-effects firing during SSR / route transition that previously
// contributed to the "SSR rendering failed" runtime error.

import { useCallback, useRef, useState } from "react";
import { Upload as UploadIcon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (name: string, size: number) => void;
  disabled?: boolean;
}

export function FileDropZone({ files, onAdd, onRemove, disabled }: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = useCallback(
    (fl: FileList | null) => {
      if (!fl || fl.length === 0) return;
      onAdd(Array.from(fl));
    },
    [onAdd],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDrag(true); } }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload file area"
        className={cn(
          "border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition cursor-pointer",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
          disabled && "opacity-60 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.xlsx,.xls,image/*"
          onChange={(e) => {
            pick(e.target.files);
            // Reset so picking the same file again still fires onChange.
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="sr-only"
          aria-label="File input"
          disabled={disabled}
        />
        <div className="size-14 mx-auto rounded-full bg-primary/10 text-primary grid place-items-center mb-4">
          <UploadIcon className="size-6" />
        </div>
        <h3 className="text-base font-semibold">Drop your files here</h3>
        <p className="text-sm text-muted-foreground mt-1">
          PDF · CSV · Excel · Photos of invoices (max 20 MB each)
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          disabled={disabled}
        >
          Choose files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div
              key={`${f.name}-${f.size}`}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <FileText className="size-5 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${f.name}`}
                onClick={() => onRemove(f.name, f.size)}
                disabled={disabled}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
