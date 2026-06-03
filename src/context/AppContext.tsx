import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockAlerts, mockReport, mockUploads, mockUser, type Alert, type MockUser, type Report, type Role, type Upload } from "@/lib/mock";

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
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [role, setRole] = useState<Role>("owner");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

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
  }), [user, role, uploads, reports, alerts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
