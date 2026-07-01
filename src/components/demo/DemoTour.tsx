// ============================================================================
// DemoTour — automated end-to-end walkthrough that runs once per session
// after a fresh login. It uploads five pre-bundled ABC Technologies PDFs,
// runs Siphon Cypher extraction, kicks off Transmit Assessment, opens the
// report and finishes on the Alerts page. Each step is narrated by a
// centre-screen tooltip card so the viewer can watch production behaviour.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { mockReport } from "@/lib/mock";
import { detectKind, extractClientSide, extractServerSide } from "@/lib/extract/client";
import { Sparkles, X } from "lucide-react";

const DEMO_FILES = [
  "ABC_Technologies_Bank_Statement_Jan-Jun_2026.pdf",
  "ABC_Technologies_General_Ledger_Jan-Jun_2026.pdf",
  "ABC_Technologies_Supplier_Invoices_Jan-Jun_2026.pdf",
  "ABC_Technologies_Vendor_Master_Jan-Jun_2026.pdf",
  "ABC_Technologies_Employee_Expense_Claims_Jan-Jun_2026.pdf",
];

const SESSION_FLAG = "grey_demo_tour_v1";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchDemoFile(name: string): Promise<File> {
  const res = await fetch(`/demo/${name}`);
  const blob = await res.blob();
  return new File([blob], name, { type: "application/pdf" });
}

interface Step {
  title: string;
  body: string;
}

export function DemoTour() {
  const { user, addUpload, addReport, addAlertsFromReport, setExtractedText } = useApp();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const startedRef = useRef(false);

  const [step, setStep] = useState<Step | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user || startedRef.current) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_FLAG) === "done") return;
    // Only auto-start once the user lands on the dashboard after sign-in.
    if (!pathname.startsWith("/dashboard")) return;

    startedRef.current = true;
    sessionStorage.setItem(SESSION_FLAG, "done");
    void runTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pathname]);

  const show = async (title: string, body: string, holdMs = 2600) => {
    setStep({ title, body });
    await wait(holdMs);
  };

  async function runTour() {
    setRunning(true);
    try {
      await show(
        "Welcome to Grey Analytics",
        `Hi ${user?.name ?? "there"} — sit back. I will run a full audit on a sample company, ABC Technologies, so you can see how the platform works end to end.`,
        3800,
      );

      await show("Step 1 · Uploading business documents", "Loading five real PDFs into Siphon Cypher: bank statement, general ledger, supplier invoices, vendor master and expense claims.", 2800);
      navigate({ to: "/upload" });
      await wait(1200);

      // Extract text from every demo file, exactly as the manual upload flow.
      const chunks: string[] = [];
      for (const name of DEMO_FILES) {
        await show(`Reading ${name.replace("ABC_Technologies_", "").replace(/_/g, " ").replace(".pdf", "")}`, "Client-side PDF parsing with OCR fallback on the server if needed.", 1600);
        const file = await fetchDemoFile(name);
        const kind = detectKind(file);
        let res = await extractClientSide(file);
        if (!res.ok) res = await extractServerSide(file);
        if (res.ok) {
          chunks.push(`=== ${file.name} ===\n${res.text}`);
          addUpload({
            id: "up_" + Math.random().toString(36).slice(2, 9),
            fileName: file.name,
            size: (file.size / 1024).toFixed(0) + " KB",
            uploadedAt: new Date(),
            status: "ready",
            source: kind === "pdf" ? "PDF" : "PDF",
          });
        }
      }

      const text = chunks.join("\n\n");
      const report = mockReport(user?.businessName ?? "ABC Technologies");
      addReport(report);
      addAlertsFromReport(report);
      setExtractedText(report.id, text);

      await show("Step 2 · Transmit Assessment", `Handing ${text.length.toLocaleString()} characters to four specialist AI agents: Finance, Operations, Compliance and Strategy. They run in parallel on Groq.`, 3200);
      navigate({ to: "/analysis/$id", params: { id: report.id } });
      // Give agents a moment to spin up + partially complete before moving.
      await wait(2200);
      await show("Watching the agents work", "Each card lights up as an agent finishes. Findings surface with severity, evidence and recommended fixes.", 4200);
      await wait(4000);
      await show("Alerts fired automatically", "As soon as all four agents finish, high-severity anomalies are pushed via WhatsApp (Twilio) and Email (Resend) in the background.", 3400);

      await show("Step 3 · Audit report", "Opening the plain-English audit report with charts, evidence and remediation plans, ready for export.", 2600);
      navigate({ to: "/report/$id", params: { id: report.id } });
      await wait(5000);

      await show("Step 4 · Alerts inbox", "Every dispatched alert is logged here so owners and accountants can audit what was sent, when and to whom.", 2800);
      navigate({ to: "/alerts" });
      await wait(3800);

      await show("Demo complete", "That is the full flow: upload, extract, analyse, alert, report. Head back to the dashboard to try it with your own documents.", 4200);
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Demo interrupted";
      await show("Demo interrupted", msg, 3000);
    } finally {
      setStep(null);
      setRunning(false);
    }
  }

  if (typeof document === "undefined") return null;
  if (!step && !running) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-6 z-[9999] flex justify-center px-4 pointer-events-none">
      {step && (
        <div className="pointer-events-auto max-w-md w-full rounded-xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">Live demo</div>
              <div className="font-semibold text-sm mt-0.5">{step.title}</div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.body}</p>
            </div>
            <button
              type="button"
              aria-label="End demo"
              onClick={() => { setStep(null); setRunning(false); startedRef.current = true; }}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 h-1 rounded-full bg-primary/10 overflow-hidden">
            <div className="h-full bg-primary animate-[demoBar_2.6s_linear_infinite]" style={{ width: "40%" }} />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
