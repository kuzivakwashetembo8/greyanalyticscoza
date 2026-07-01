// ============================================================================
// DemoTour — automated end-to-end walkthrough that DRIVES THE REAL UI on
// screen: it navigates to /upload, injects five demo PDFs into the actual
// file-drop input, clicks the real "Start" button so users watch Siphon
// Cypher's progress bar animate, then clicks "Analyze" in the success
// modal, watches the 4 agents complete on /analysis, and finishes on the
// Alerts page. Narration is a small, corner-anchored caption chip so it
// never covers the working area.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouterState } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { Sparkles, X } from "lucide-react";

const DEMO_FILES = [
  "ABC_Technologies_Bank_Statement_Jan-Jun_2026.pdf",
  "ABC_Technologies_General_Ledger_Jan-Jun_2026.pdf",
  "ABC_Technologies_Supplier_Invoices_Jan-Jun_2026.pdf",
  "ABC_Technologies_Vendor_Master_Jan-Jun_2026.pdf",
  "ABC_Technologies_Employee_Expense_Claims_Jan-Jun_2026.pdf",
];

const SESSION_FLAG = "grey_demo_tour_v2";

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function fetchDemoFile(name: string): Promise<File> {
  const res = await fetch(`/demo/${name}`);
  const blob = await res.blob();
  return new File([blob], name, { type: "application/pdf" });
}

interface Step { title: string; body: string }

// Poll the DOM until a selector matches or timeout expires.
async function waitFor<T extends Element>(selector: string, timeout = 6000): Promise<T | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector<T>(selector);
    if (el) return el;
    await wait(120);
  }
  return null;
}

// Find a button whose visible text includes `label` (case-insensitive).
async function waitForButton(label: string, timeout = 6000): Promise<HTMLButtonElement | null> {
  const start = Date.now();
  const needle = label.toLowerCase();
  while (Date.now() - start < timeout) {
    const btns = Array.from(document.querySelectorAll<HTMLButtonElement>("button, a[role=button], a"));
    const hit = btns.find((b) => (b.textContent ?? "").toLowerCase().includes(needle) && !b.hasAttribute("disabled"));
    if (hit) return hit as HTMLButtonElement;
    await wait(150);
  }
  return null;
}

export function DemoTour() {
  const { user } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const startedRef = useRef(false);

  const [step, setStep] = useState<Step | null>(null);
  const [running, setRunning] = useState(false);
  const cancelledRef = useRef(false);

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

  const show = (title: string, body: string) => {
    if (cancelledRef.current) return;
    setStep({ title, body });
  };

  // Click a real button by its label. Returns true if clicked.
  const clickByLabel = async (label: string): Promise<boolean> => {
    const btn = await waitForButton(label);
    if (!btn || cancelledRef.current) return false;
    btn.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(400);
    btn.click();
    return true;
  };

  // Navigate by clicking the real sidebar link, so the user visibly sees
  // the click land on the menu item.
  const goTo = async (hrefOrLabel: string): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < 4000) {
      const link = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .find((a) => a.getAttribute("href") === hrefOrLabel
          || (a.textContent ?? "").trim().toLowerCase() === hrefOrLabel.toLowerCase());
      if (link && !cancelledRef.current) {
        link.scrollIntoView({ behavior: "smooth", block: "center" });
        await wait(300);
        link.click();
        return true;
      }
      await wait(150);
    }
    return false;
  };

  async function runTour() {
    setRunning(true);
    try {
      show("Welcome demo", `Hi ${user?.name ?? "there"} — I will drive the app on-screen using a sample company, ABC Technologies.`);
      await wait(3200);

      // Step 1 — visibly navigate to Upload via the sidebar link.
      show("Opening Upload", "Clicking the Upload link in the sidebar.");
      await goTo("/upload");
      await wait(900);

      // Step 2 — fetch the five demo PDFs, then push them through the REAL
      // file input so the FileDropZone list fills in front of the user.
      show("Loading sample documents", "Fetching five ABC Technologies PDFs from the demo bundle.");
      const files: File[] = [];
      for (const name of DEMO_FILES) {
        files.push(await fetchDemoFile(name));
      }
      if (cancelledRef.current) return;

      const input = await waitFor<HTMLInputElement>('input[type="file"]');
      if (!input) throw new Error("Upload input not found");

      show("Dropping files into Siphon Cypher", "You are watching the real drop-zone accept every PDF, one by one.");
      // Feed the files one at a time so the list animates in.
      for (const f of files) {
        if (cancelledRef.current) return;
        const dt = new DataTransfer();
        dt.items.add(f);
        // Native property setter — React tracks the input.files getter.
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files")?.set;
        setter?.call(input, dt.files);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await wait(650);
      }

      // Step 3 — click the real Start button.
      await wait(600);
      show("Starting extraction", "Clicking Start so Siphon Cypher parses every page.");
      const started = await clickByLabel("Start");
      if (!started) throw new Error("Start button not found");

      // Wait until the success dialog appears (Analyze button is inside it).
      show("Extracting text", "Real client-side PDF parsing is running now. Watch the progress bar above.");
      const analyze = await waitForButton("Analyze", 60_000);
      if (!analyze) throw new Error("Extraction did not finish in time");

      show("Extraction complete", "Success modal opened. Clicking Analyze to hand the text to the four AI agents.");
      await wait(1400);
      analyze.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(300);
      analyze.click();

      // On /analysis/$id — let the agent cards animate to done.
      show("Transmit Assessment", "Four Groq agents (Finance, Operations, Compliance, Strategy) run in parallel. Each card lights up as it finishes.");
      await wait(9000);

      show("Alerts fired", "High-severity findings are being pushed via WhatsApp and Email in the background.");
      await wait(3500);

      // Step 4 — visibly click into the Alerts page via the sidebar.
      show("Opening Alerts", "Clicking Alerts in the sidebar to review every dispatch.");
      await goTo("/alerts");
      await wait(4200);

      // Step 5 — back to the dashboard via the sidebar.
      show("Back to Dashboard", "Handing control back to you. Upload your own documents to try it live.");
      await goTo("/dashboard");
      await wait(2600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Demo interrupted";
      show("Demo interrupted", msg);
      await wait(3000);
    } finally {
      setStep(null);
      setRunning(false);
    }
  }

  if (typeof document === "undefined") return null;
  if (!step && !running) return null;

  return createPortal(
    // Compact caption chip anchored to the top-right so it never covers the
    // working area the tour is driving.
    <div className="fixed top-4 right-4 z-[9999] max-w-[280px] pointer-events-none">
      {step && (
        <div className="pointer-events-auto rounded-lg border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl p-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-2">
            <div className="size-6 rounded-md bg-primary/10 grid place-items-center shrink-0">
              <Sparkles className="size-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Live demo</div>
              <div className="font-semibold text-xs mt-0.5">{step.title}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{step.body}</p>
            </div>
            <button
              type="button"
              aria-label="End demo"
              onClick={() => { cancelledRef.current = true; setStep(null); setRunning(false); }}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <div className="mt-2 h-0.5 rounded-full bg-primary/10 overflow-hidden">
            <div className="h-full bg-primary animate-[demoBar_2.6s_linear_infinite]" style={{ width: "40%" }} />
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
