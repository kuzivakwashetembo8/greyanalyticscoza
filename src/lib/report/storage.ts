// Persist generated reports to localStorage so a refresh / re-visit does not
// re-run the LLM. Keyed per reportId.
import type { ReportNarrative } from "./types";

const KEY = (id: string) => `ga_report_${id}`;

export function loadReport(reportId: string): ReportNarrative | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY(reportId));
    if (!raw) return null;
    return JSON.parse(raw) as ReportNarrative;
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

export function timestampForFilename(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

export function reportFilename(ext: "pdf" | "docx" | "txt", d: Date = new Date()): string {
  return `GreyAnalytics_Report_${timestampForFilename(d)}.${ext}`;
}
