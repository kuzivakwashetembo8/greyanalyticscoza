// Transmit Assessment — results page.
// Auto-runs all 4 agents in parallel on first mount (when no cached results
// exist) and renders per-agent status with retry. This page is intentionally
// SEPARATE from /report/$id, which still shows the mock audit content.

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { AGENTS, type AgentId, type AgentResult } from "@/lib/analysis/types";
import { runAgent } from "@/lib/analysis/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/analysis/$id")({
  head: () => ({ meta: [{ title: "Transmit Assessment · Grey Analytics" }] }),
  component: AnalysisPage,
});

type AgentStatus = "idle" | "running" | "done" | "error";
interface AgentState {
  status: AgentStatus;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

const SEVERITY_BADGE: Record<"high" | "medium" | "low", string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

function AnalysisPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { extractedTexts, analyses, setAgentResult, reports, getReport } = useApp();
  const report = id === "latest" ? reports[0] : getReport(id);
  const reportId = report?.id ?? id;
  const text = extractedTexts[reportId] ?? "";
  const cached = analyses[reportId] ?? {};
  const [inputOpen, setInputOpen] = useState(false);

  const [state, setState] = useState<Record<AgentId, AgentState>>(() => ({
    finance: { status: cached.finance ? "done" : "idle" },
    operations: { status: cached.operations ? "done" : "idle" },
    compliance: { status: cached.compliance ? "done" : "idle" },
    strategy: { status: cached.strategy ? "done" : "idle" },
  }));

  // Guard against double-invoke in StrictMode and across re-renders.
  const startedRef = useRef(false);

  const launchAgent = async (agent: AgentId) => {
    setState((s) => ({ ...s, [agent]: { status: "running", startedAt: Date.now() } }));
    try {
      const result: AgentResult = await runAgent(agent, text);
      setAgentResult(reportId, agent, result);
      setState((s) => ({ ...s, [agent]: { status: "done", finishedAt: Date.now() } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Agent failed";
      setState((s) => ({ ...s, [agent]: { status: "error", error: msg, finishedAt: Date.now() } }));
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    if (!report || !text || text.trim().length < 10) return;
    startedRef.current = true;
    // Fan out — agents run in parallel; partial results render as soon as
    // each one completes (since each writes to context independently).
    AGENTS.forEach((a) => {
      if (!cached[a.id]) void launchAgent(a.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, text]);

  const doneCount = useMemo(
    () => AGENTS.filter((a) => state[a.id].status === "done").length,
    [state],
  );
  const progress = Math.round((doneCount / AGENTS.length) * 100);

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Analysis not found.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!text || text.trim().length < 10) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <ShieldAlert className="size-10 mx-auto text-muted-foreground" />
        <h1 className="text-xl font-semibold">No extracted text on this report</h1>
        <p className="text-muted-foreground">
          Transmit Assessment needs raw text from Siphon Cypher. Re-run the upload to generate it.
        </p>
        <Button onClick={() => navigate({ to: "/upload" })}>Go to upload</Button>
      </div>
    );
  }

  const totalAnomalies = AGENTS.reduce(
    (sum, a) => sum + ((cached[a.id]?.anomalies?.length) ?? 0),
    0,
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-3.5" />Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Sparkles className="size-6 text-primary" /> Transmit Assessment
          </h1>
          <p className="text-muted-foreground">
            {report.businessName} · 4-agent structured analysis (separate from the audit report).
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setInputOpen(true)}>
            <Eye className="size-4 mr-1.5" />View Input
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/report/$id" params={{ id: reportId }}>
              Open mock report
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Agent progress</CardTitle>
              <CardDescription>
                {doneCount} of {AGENTS.length} complete · {totalAnomalies} finding{totalAnomalies === 1 ? "" : "s"} so far
              </CardDescription>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{progress}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progress} />
          <div className="grid sm:grid-cols-2 gap-2">
            {AGENTS.map((a) => {
              const st = state[a.id];
              const res = cached[a.id];
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {st.status === "running" && <Loader2 className="size-4 animate-spin text-primary shrink-0" />}
                    {st.status === "done" && <CheckCircle2 className="size-4 text-success shrink-0" />}
                    {st.status === "error" && <AlertTriangle className="size-4 text-destructive shrink-0" />}
                    {st.status === "idle" && <div className="size-4 rounded-full border border-border shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{a.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.model}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {res?.mocked && (
                      <Badge variant="outline" className="text-[10px] py-0">demo data</Badge>
                    )}
                    {st.status === "error" && (
                      <Button size="sm" variant="ghost" onClick={() => launchAgent(a.id)}>
                        <RefreshCw className="size-3.5 mr-1" />Retry
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" defaultValue={AGENTS.map((a) => a.id)} className="space-y-3">
        {AGENTS.map((a) => {
          const st = state[a.id];
          const res = cached[a.id];
          return (
            <AccordionItem key={a.id} value={a.id} className="border border-border rounded-lg bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  <span className="font-semibold">{a.label}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{a.focus}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {res && (
                      <Badge variant="secondary" className="text-[11px]">
                        confidence {Math.round(res.confidence * 100)}%
                      </Badge>
                    )}
                    {res && (
                      <Badge variant="outline" className="text-[11px]">
                        {res.anomalies.length} finding{res.anomalies.length === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {st.status === "running" && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Running on {a.model}…
                  </div>
                )}
                {st.status === "error" && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <div className="font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="size-4" /> Agent failed
                    </div>
                    <p className="text-muted-foreground mt-1">{st.error}</p>
                    <Button size="sm" className="mt-2" onClick={() => launchAgent(a.id)}>
                      <RefreshCw className="size-3.5 mr-1.5" />Retry agent
                    </Button>
                  </div>
                )}
                {res && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Anomalies ({res.anomalies.length})
                      </div>
                      {res.anomalies.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No anomalies flagged.</p>
                      ) : (
                        <ul className="space-y-2.5">
                          {res.anomalies.map((an, i) => (
                            <li key={i} className="rounded-md border border-border p-3 text-sm">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium">{an.type}</span>
                                <span
                                  className={cn(
                                    "text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border",
                                    SEVERITY_BADGE[an.severity],
                                  )}
                                >
                                  {an.severity}
                                </span>
                              </div>
                              <p>{an.description}</p>
                              {an.evidence && (
                                <p className="text-xs text-muted-foreground mt-1.5">
                                  <span className="font-semibold">Evidence:</span> {an.evidence}
                                </p>
                              )}
                              {an.fix && (
                                <p className="text-xs mt-1.5">
                                  <span className="font-semibold text-success">Fix:</span> {an.fix}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {res.insights.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          Strategic insights
                        </div>
                        <ul className="space-y-1.5 text-sm list-disc pl-5">
                          {res.insights.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {st.status === "idle" && !res && (
                  <p className="text-sm text-muted-foreground">Queued…</p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <p className="text-xs text-muted-foreground text-center">
        Transmit Assessment output is the source analysis for the upcoming Audit Report. It is intentionally
        separate from the mock report shown under <span className="font-mono">/report/{reportId}</span>.
      </p>

      <Dialog open={inputOpen} onOpenChange={setInputOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Extracted input text</DialogTitle>
            <DialogDescription>Raw text Siphon Cypher pulled from your uploaded files.</DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted/40 border border-border rounded-md p-4 max-h-[60vh] overflow-auto whitespace-pre-wrap font-mono">
            {text}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
