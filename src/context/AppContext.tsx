import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAlerts, mockReport, mockUploads, mockUser, type Alert, type MockUser, type Report, type Role, type Upload } from "@/lib/mock";
import type { AgentId, AgentResult } from "@/lib/analysis/types";

interface AppState {
  user: MockUser | null;
  role: Role;
  setRole: (r: Role) => void;
  login: (email: string) => void;
  logout: () => void;
  uploads: Upload[];
  addUpload: (u: Upload) => void;
  reports: Report[];
  addReport: (r: Report) => Report;
  getReport: (id: string) => Report | undefined;
  alerts: Alert[];
  addAlertsFromReport: (r: Report) => void;
  markAlertRead: (id: string) => void;
  extractedTexts: Record<string, string>;
  setExtractedText: (reportId: string, text: string) => void;
  // Transmit Assessment — per-report, per-agent analysis results.
  analyses: Record<string, Partial<Record<AgentId, AgentResult>>>;
  setAgentResult: (reportId: string, agent: AgentId, result: AgentResult) => void;
  clearAnalysis: (reportId: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [role, setRole] = useState<Role>("owner");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, Partial<Record<AgentId, AgentResult>>>>({});


  // Seed mock data when user logs in
  useEffect(() => {
    if (user && uploads.length === 0) {
      setUploads(mockUploads(4));
      const seedReport = mockReport(user.businessName);
      setReports([seedReport]);
      setAlerts(mockAlerts(seedReport.leaks));
    }
  }, [user, uploads.length]);

  const value = useMemo<AppState>(() => ({
    user,
    role,
    setRole: (r) => {
      setRole(r);
      setUser((u) => (u ? { ...u, role: r } : u));
    },
    login: (email) => {
      const u = mockUser(role);
      setUser({ ...u, email });
    },
    logout: () => {
      setUser(null);
      setUploads([]);
      setReports([]);
      setAlerts([]);
      setExtractedTexts({});
      setAnalyses({});
    },
    uploads,
    addUpload: (u) => setUploads((prev) => [u, ...prev]),
    reports,
    addReport: (r) => {
      setReports((prev) => [r, ...prev]);
      return r;
    },
    getReport: (id) => reports.find((r) => r.id === id) ?? reports[0],
    alerts,
    addAlertsFromReport: (r) => {
      const newAlerts = mockAlerts(r.leaks);
      setAlerts((prev) => [...newAlerts, ...prev]);
    },
    markAlertRead: (id) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a))),
    extractedTexts,
    setExtractedText: (reportId, text) => setExtractedTexts((prev) => ({ ...prev, [reportId]: text })),
    analyses,
    setAgentResult: (reportId, agent, result) =>
      setAnalyses((prev) => ({ ...prev, [reportId]: { ...(prev[reportId] ?? {}), [agent]: result } })),
    clearAnalysis: (reportId) =>
      setAnalyses((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      }),
  }), [user, role, uploads, reports, alerts, extractedTexts, analyses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
