// Persist generated reports to localStorage so a refresh / re-visit does not
// re-run the LLM. Keyed per reportId.
import type { ReportNarrative } from "./types";
import { supabase } from "@/integrations/supabase/client";

const KEY = (id: string) => `ga_report_${id}`;

function withDefaults(report: ReportNarrative): ReportNarrative {
  return {
    ...report,
    methodology: report.methodology ?? { documents: [], checks: [], limitations: [] },
    disclaimer: report.disclaimer ?? "Grey Analytics provides AI-assisted financial inspection, not a statutory independent audit.",
  };
}

export function loadReport(reportId: string): ReportNarrative | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(reportId));
    if (!raw) return null;
    return withDefaults(JSON.parse(raw) as ReportNarrative);
  } catch {
    return null;
  }
}

export function saveReport(report: ReportNarrative): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY(report.reportId), JSON.stringify(report));
  } catch {
    /* quota — silently skip */
  }
}

export async function loadReportRemote(reportId: string): Promise<ReportNarrative | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase
    .from("reports")
    .select("narrative,report_version")
    .eq("id", reportId)
    .eq("user_id", session.session.user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.narrative) return null;
  return withDefaults({ ...(data.narrative as unknown as ReportNarrative), version: data.report_version });
}

export async function saveReportRemote(report: ReportNarrative): Promise<number> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Not signed in");
  const { data: current, error: readError } = await supabase
    .from("reports")
    .select("report_version")
    .eq("id", report.reportId)
    .eq("user_id", session.session.user.id)
    .single();
  if (readError) throw new Error(readError.message);
  const version = (current.report_version ?? 0) + 1;
  const stored = { ...report, version };
  const { error } = await supabase
    .from("reports")
    .update({
      narrative: JSON.parse(JSON.stringify(stored)),
      report_version: version,
      methodology: JSON.parse(JSON.stringify(report.methodology)),
    })
    .eq("id", report.reportId)
    .eq("user_id", session.session.user.id);
  if (error) throw new Error(error.message);
  return version;
}

export function timestampForFilename(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export function reportFilename(ext: "pdf" | "docx" | "txt", d: Date = new Date()): string {
  return `GreyAnalytics_Report_${timestampForFilename(d)}.${ext}`;
}
