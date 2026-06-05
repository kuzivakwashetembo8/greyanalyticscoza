// Inspection Export — dedicated report page.
// Loads cached report from localStorage; if none exists, composes a new one
// via /api/report (Groq narrative writer with mock fallback). Export buttons
// trigger PDF (browser print), DOCX, and TXT downloads.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { AGENTS } from "@/lib/analysis/types";
import { composeNarrative } from "@/lib/report/client";
import { loadReport, saveReport, reportFilename } from "@/lib/report/storage";
import { exportDocx, exportPdf, exportTxt } from "@/lib/report/exports";
import { InspectionReport } from "@/components/report/InspectionReport";
import type { ReportNarrative } from "@/lib/report/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowLeft,
  FileDown,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inspection/$id")({
  head: () => ({ meta: [{ title: "Inspection Export · Grey Analytics" }] }),
  component: InspectionExportPage,
});

type Phase = "idle" | "loading-cache" | "composing" | "ready" | "error";

function InspectionExportPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { reports, getReport, analyses } = useApp();
  const report = id === "latest" ? reports[0] : getReport(id);
  const reportId = report?.id ?? id;

  const [phase, setPhase] = useState<Phase>("loading-cache");
  const [progress, setProgress] = useState(0);
  const [narrative, setNarrative] = useState<ReportNarrative | null>(null);
  const [error, setError] = useState<string | null>(null);
  const composed = useRef(false);

  const agentResults = analyses[reportId] ?? {};
  const completeAgents = AGENTS.filter((a) => agentResults[a.id]).length;
  const ready = completeAgents === AGENTS.length;

  // Step 1 — try localStorage on mount.
  useEffect(() => {
    if (!reportId) return;
    const cached = loadReport(reportId);
    if (cached) {
      setNarrative(cached);
      setPhase("ready");
    } else {
      setPhase("idle");
    }
  }, [reportId]);

  const compose = useCallback(async () => {
    if (!report || composed.current) return;
    composed.current = true;
    setPhase("composing");
    setError(null);
    setProgress(8);

    // Soft progress while we wait on the LLM (no SSE — single POST).
    const tick = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.max(1, Math.round((90 - p) / 12)) : p));
    }, 700);

    try {
      const { pages, mocked } = await composeNarrative(report.businessName, agentResults);
      const result: ReportNarrative = {
        businessName: report.businessName,
        generatedAt: new Date().toISOString(),
        reportId,
        pages,
        analyses: agentResults,
      };
      saveReport(result);
      setNarrative(result);
      setProgress(100);
      setPhase("ready");
      if (mocked) toast.message("Report generated", { description: "Using demo narrative (no Groq key configured)." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Composer failed";
      setError(msg);
      setPhase("error");
      composed.current = false; // allow retry
    } finally {
      clearInterval(tick);
    }
  }, [report, reportId, agentResults]);

  // Auto-compose when analysis is complete and no cached narrative exists.
  useEffect(() => {
    if (phase === "idle" && ready) void compose();
  }, [phase, ready, compose]);

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Report not found.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }

  // Empty state — analysis hasn't finished yet.
  if (!ready && phase !== "ready") {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4 text-center">
        <Sparkles className="size-10 mx-auto text-primary" />
        <h1 className="text-xl font-semibold">Run Transmit Assessment first</h1>
        <p className="text-muted-foreground">
          The Inspection Export needs all four agent analyses before it can compose the report.
          You have {completeAgents} of {AGENTS.length} complete.
        </p>
        <Button onClick={() => navigate({ to: "/analysis/$id", params: { id: reportId } })}>
          Open analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar — hidden during print via .ga-no-print */}
      <div className="ga-no-print flex flex-wrap items-center gap-3 justify-between">
        <div>
          <Link to="/analysis/$id" params={{ id: reportId }} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-3.5" />Back to analysis
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <FileText className="size-6 text-primary" /> Inspection Export
          </h1>
          <p className="text-muted-foreground">5-page audit report · {report.businessName}</p>
        </div>
        {narrative && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportPdf(reportFilename("pdf"))}>
              <Printer className="size-4 mr-1.5" />PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => void exportDocx(narrative)}>
              <FileDown className="size-4 mr-1.5" />DOCX
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportTxt(narrative)}>
              <FileDown className="size-4 mr-1.5" />TXT
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { composed.current = false; void compose(); }}>
              <RefreshCw className="size-4 mr-1.5" />Regenerate
            </Button>
          </div>
        )}
      </div>

      {phase === "composing" && (
        <Card className="ga-no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Composing your report</CardTitle>
            <CardDescription>
              The narrative writer is turning your analysis into plain-English findings. This usually takes 15–40 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} />
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card className="ga-no-print border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Report generation failed
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void compose()}>
              <RefreshCw className="size-4 mr-1.5" />Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {narrative && <InspectionReport report={narrative} />}
    </div>
  );
}
