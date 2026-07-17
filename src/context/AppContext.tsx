import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { type Alert, type MockUser, type Report, type Role, type Upload } from "@/lib/mock";
import type { AgentId, AgentResult } from "@/lib/analysis/types";
import {
  loadAlerts, loadReports, loadReportExtras, loadUploads,
  markAlertReadRemote, markAllAlertsReadRemote,
  saveAlerts, saveAgentResults, saveReport, saveUpload,
  updateProfile, type ProfilePatch,
} from "@/lib/persistence";

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
  user: (MockUser & { uploadLimit: number; notifyWhatsapp: boolean; notifyEmail: boolean; plan: string }) | null;
  role: Role;
  loading: boolean;
  setRole: (r: Role) => void;
  /** @deprecated kept for backwards compatibility — use signIn/signUp instead */
  login: (email: string) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, businessName: string, opts?: { whatsapp?: string; termsVersion?: string }) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<{ error?: string }>;
  uploads: Upload[];
  addUpload: (u: Upload) => void;
  reports: Report[];
  addReport: (r: Report) => Report;
  getReport: (id: string) => Report | undefined;
  alerts: Alert[];
  addAlertsFromReport: (r: Report) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  extractedTexts: Record<string, string>;
  setExtractedText: (reportId: string, text: string) => void;
  analyses: Record<string, Partial<Record<AgentId, AgentResult>>>;
  setAgentResult: (reportId: string, agent: AgentId, result: AgentResult) => void;
  clearAnalysis: (reportId: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState["user"]>(null);
  const [role, setRoleState] = useState<Role>("owner");
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [extractedTexts, setExtractedTexts] = useState<Record<string, string>>({});
  const [analyses, setAnalyses] = useState<Record<string, Partial<Record<AgentId, AgentResult>>>>({});

  const hydrateProfile = useCallback(async (userId: string, fallbackEmail: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id,email,name,business_name,role,whatsapp,notify_whatsapp,notify_email,upload_limit,plan")
      .eq("id", userId)
      .maybeSingle();

    const mapped: AppState["user"] = {
      id: userId,
      email: data?.email ?? fallbackEmail,
      name: data?.name ?? fallbackEmail.split("@")[0],
      businessName: data?.business_name ?? "My Business",
      role: (data?.role as Role) ?? "owner",
      whatsapp: data?.whatsapp ?? "",
      uploadLimit: data?.upload_limit ?? 5,
      notifyWhatsapp: data?.notify_whatsapp ?? true,
      notifyEmail: data?.notify_email ?? true,
      plan: data?.plan ?? "free",
    };
    setUser(mapped);
    setRoleState(mapped.role);
  }, []);

  useEffect(() => {
    // 1. Listener FIRST — avoids missing INITIAL_SESSION race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Defer Supabase calls out of the callback to prevent re-entry locks.
        setTimeout(() => {
          hydrateProfile(session.user.id, session.user.email ?? "").then(() => {
            if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
              Promise.all([loadUploads(), loadReports(), loadAlerts(), loadReportExtras()])
                .then(([u, r, a, extras]) => {
                  setUploads(u);
                  setReports(r);
                  setAlerts(a);
                  const texts: Record<string, string> = {};
                  const ans: Record<string, Partial<Record<AgentId, AgentResult>>> = {};
                  for (const [id, ex] of Object.entries(extras)) {
                    if (ex.extracted_text) texts[id] = ex.extracted_text;
                    if (ex.agent_results && Object.keys(ex.agent_results).length) ans[id] = ex.agent_results;
                  }
                  setExtractedTexts(texts);
                  setAnalyses(ans);
                }).catch(() => { /* stay empty */ });
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
      if (user) {
        supabase.from("profiles").update({ role: r }).eq("id", user.id).then(() => {});
      }
    },
    login: () => { /* deprecated no-op */ },
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password, businessName, opts) => {
      const redirectUrl = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            business_name: businessName,
            name: email.split("@")[0],
            role: "owner",
            whatsapp: opts?.whatsapp ?? "",
            terms_version: opts?.termsVersion ?? "v1-2026-07",
          },
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
    updateProfile: async (patch) => {
      const res = await updateProfile(patch);
      if (!res.error) {
        // Optimistically reflect in local user state.
        setUser((u) => u ? {
          ...u,
          name: patch.name ?? u.name,
          businessName: patch.business_name ?? u.businessName,
          whatsapp: patch.whatsapp ?? u.whatsapp,
          notifyWhatsapp: patch.notify_whatsapp ?? u.notifyWhatsapp,
          notifyEmail: patch.notify_email ?? u.notifyEmail,
          uploadLimit: patch.upload_limit ?? u.uploadLimit,
          plan: patch.plan ?? u.plan,
        } : u);
      }
      return res;
    },
    uploads,
    addUpload: (u) => { setUploads((prev) => [u, ...prev]); void saveUpload(u); },
    reports,
    addReport: (r) => { setReports((prev) => [r, ...prev]); return r; },
    getReport: (id) => reports.find((r) => r.id === id) ?? reports[0],
    alerts,
    addAlertsFromReport: (_r) => { /* real alerts are created by the /api/alerts pipeline */ },
    markAlertRead: (id) => {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
      void markAlertReadRemote(id);
    },
    markAllAlertsRead: () => {
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
      void markAllAlertsReadRemote();
    },
    extractedTexts,
    setExtractedText: (reportId, text) => setExtractedTexts((prev) => ({ ...prev, [reportId]: text })),
    analyses,
    setAgentResult: (reportId, agent, result) =>
      setAnalyses((prev) => {
        const merged = { ...(prev[reportId] ?? {}), [agent]: result };
        // Persist server-side so results survive refreshes.
        void saveAgentResults(reportId, merged);
        return { ...prev, [reportId]: merged };
      }),
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
