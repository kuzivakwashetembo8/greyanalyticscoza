import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { mockAlerts, mockReport, mockUploads, type Alert, type MockUser, type Report, type Role, type Upload } from "@/lib/mock";
import type { AgentId, AgentResult } from "@/lib/analysis/types";

// ============================================================================
// AppContext — wired to real Lovable Cloud (Supabase) auth.
// Auth flow:
//   1. On mount: register onAuthStateChange listener FIRST, then read current
//      session. This avoids missing the initial SIGNED_IN event.
//   2. When a session exists, load the matching row from public.profiles and
//      map it onto the existing MockUser shape so the rest of the app keeps
//      working without changes.
//   3. Sign in / sign up / Google OAuth / sign out are exposed as async
//      methods on the context. The legacy `login(email)` helper is kept as a
//      no-op alias for any old call sites but new code should use signIn.
// All other state (uploads/reports/alerts) remains client-side mock data.
// ============================================================================

interface AppState {
  user: MockUser | null;
  role: Role;
  loading: boolean;
  setRole: (r: Role) => void;
  /** @deprecated kept for backwards compatibility — use signIn/signUp instead */
  login: (email: string) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
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
  analyses: Record<string, Partial<Record<AgentId, AgentResult>>>;
  setAgentResult: (reportId: string, agent: AgentId, result: AgentResult) => void;
  clearAnalysis: (reportId: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [role, setRoleState] = useState<Role>("owner");
  const [loading, setLoading] = useState(true);
  const [uploadLimit, setUploadLimitState] = useState(5);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, Partial<Record<AgentId, AgentResult>>>>({});

  // Load profile row and shape into MockUser. Deferred from auth callbacks
  // via setTimeout(0) to avoid the Supabase deadlock pattern.
  const hydrateProfile = useCallback(async (userId: string, fallbackEmail: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,name,business_name,role")
      .eq("id", userId)
      .maybeSingle();

    const mapped: MockUser = {
      id: userId,
      email: data?.email ?? fallbackEmail,
      name: data?.name ?? fallbackEmail.split("@")[0],
      businessName: data?.business_name ?? "My Business",
      role: (data?.role as Role) ?? "owner",
      whatsapp: "+27 82 000 0000",
    };
    setUser(mapped);
    setRoleState(mapped.role);
  }, []);

  // Seed mock demo data once when a real user signs in.
  const seedDemoData = useCallback((businessName: string) => {
    setUploads((prev) => (prev.length === 0 ? mockUploads(4) : prev));
    setReports((prev) => {
      if (prev.length > 0) return prev;
      const seed = mockReport(businessName);
      setAlerts(mockAlerts(seed.leaks));
      return [seed];
    });
  }, []);

  useEffect(() => {
    // 1. Listener FIRST — avoids missing INITIAL_SESSION race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer Supabase calls out of the callback to prevent re-entry locks.
        setTimeout(() => {
          hydrateProfile(session.user.id, session.user.email ?? "").then(() => {
            if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
              // No mock data seed per strict instructions
            }
          });
        }, 0);
      } else {
        setUser(null);
        setUploads([]); setReports([]); setAlerts([]);
        setExtractedTexts({}); setAnalyses({});
      }
    });

    // 2. Then existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        hydrateProfile(session.user.id, session.user.email ?? "")
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [hydrateProfile]);

  const value = useMemo<AppState>(() => ({
    user,
    role,
    loading,
    setRole: (r) => {
      setRoleState(r);
      setUser((u) => (u ? { ...u, role: r } : u));
      // Persist role choice to profile (best-effort).
      if (user) {
        supabase.from("profiles").update({ role: r }).eq("id", user.id).then(() => {});
      }
    },
    login: () => { /* deprecated no-op */ },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password, businessName) => {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          // Trigger handle_new_user reads these from raw_user_meta_data.
          data: { business_name: businessName, name: email.split("@")[0], role: "owner" },
        },
      });
      return error ? { error: error.message } : {};
    },
    signInWithGoogle: async () => {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) return { error: result.error.message ?? "Sign-in failed" };
      return {};
    },
    logout: async () => { await supabase.auth.signOut(); },
    uploadLimit, setUploadLimit: setUploadLimitState,
    uploads, addUpload: (u) => setUploads((prev) => [u, ...prev]),
    reports,
    addReport: (r) => { setReports((prev) => [r, ...prev]); return r; },
    getReport: (id) => reports.find((r) => r.id === id) ?? reports[0],
    alerts,
    addAlertsFromReport: (r) => setAlerts((prev) => [...mockAlerts(r.leaks), ...prev]),
    markAlertRead: (id) => setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a))),
    extractedTexts,
    setExtractedText: (reportId, text) => setExtractedTexts((prev) => ({ ...prev, [reportId]: text })),
    analyses,
    setAgentResult: (reportId, agent, result) =>
      setAnalyses((prev) => ({ ...prev, [reportId]: { ...(prev[reportId] ?? {}), [agent]: result } })),
    clearAnalysis: (reportId) =>
      setAnalyses((prev) => { const next = { ...prev }; delete next[reportId]; return next; }),
  }), [user, role, loading, uploads, reports, alerts, extractedTexts, analyses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
