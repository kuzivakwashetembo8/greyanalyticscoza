// Client-side persistence: mirrors AppContext writes to Supabase
// (RLS enforces user_id on every row). Safe to call while unauthenticated —
// helpers no-op until a session exists.
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Alert, Report, Upload } from "@/lib/mock";
import type { AgentId, AgentResult } from "@/lib/analysis/types";

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/* ------------------------------- Uploads -------------------------------- */
export async function saveUpload(u: Upload): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("uploads").upsert({
    id: crypto.randomUUID(),
    user_id: userId,
    file_name: u.fileName,
    size: u.size,
    source: u.source,
    status: u.status,
    created_at: new Date(u.uploadedAt).toISOString(),
  }, { onConflict: "id" });
}

export async function loadUploads(): Promise<Upload[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("uploads")
    .select("id, file_name, size, source, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((r) => ({
    id: r.id,
    fileName: r.file_name,
    size: r.size ?? "",
    source: (r.source ?? "PDF") as Upload["source"],
    status: (r.status ?? "ready") as Upload["status"],
    uploadedAt: new Date(r.created_at),
  }));
}

/* ------------------------------- Reports -------------------------------- */
// Report.id is a real UUID (see emptyReport) so upserts round-trip safely.
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function saveReport(r: Report, extras: {
  status?: string; extracted_text?: string | null; upload_ids?: string[];
} = {}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const id = isUuid(r.id) ? r.id : crypto.randomUUID();
  await supabase.from("reports").upsert({
    id,
    user_id: userId,
    business_name: r.businessName,
    title: r.title,
    payload: JSON.parse(JSON.stringify(r)) as Json,
    status: extras.status ?? "extracting",
    extracted_text: extras.extracted_text ?? null,
    upload_ids: extras.upload_ids ?? [],
    created_at: new Date(r.generatedAt).toISOString(),
  }, { onConflict: "id" });
}

export async function updateReportStatus(reportId: string, status: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !isUuid(reportId)) return;
  await supabase.from("reports").update({ status }).eq("id", reportId).eq("user_id", userId);
}

export async function saveAgentResults(
  reportId: string,
  results: Partial<Record<AgentId, AgentResult>>,
): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !isUuid(reportId)) return;
  await supabase.from("reports").update({
    agent_results: JSON.parse(JSON.stringify(results)) as Json,
    status: "complete",
  }).eq("id", reportId).eq("user_id", userId);
}

export async function deleteReport(reportId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId || !isUuid(reportId)) return;
  await supabase.from("reports").delete().eq("id", reportId).eq("user_id", userId);
}

export async function loadReports(): Promise<Report[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("reports")
    .select("id, payload, created_at, agent_results, extracted_text")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((row) => {
    const r = row.payload as unknown as Report;
    // Prefer the DB row id (real UUID) so update paths stay consistent.
    return { ...r, id: row.id, generatedAt: new Date(row.created_at) };
  });
}

export async function loadReportExtras(): Promise<Record<string, {
  extracted_text: string | null;
  agent_results: Partial<Record<AgentId, AgentResult>>;
}>> {
  const userId = await currentUserId();
  if (!userId) return {};
  const { data } = await supabase
    .from("reports")
    .select("id, extracted_text, agent_results")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const out: Record<string, { extracted_text: string | null; agent_results: Partial<Record<AgentId, AgentResult>> }> = {};
  for (const row of data ?? []) {
    out[row.id] = {
      extracted_text: row.extracted_text ?? null,
      agent_results: (row.agent_results as unknown as Partial<Record<AgentId, AgentResult>>) ?? {},
    };
  }
  return out;
}

/* -------------------------------- Alerts -------------------------------- */
export async function saveAlerts(alerts: Alert[]): Promise<void> {
  const userId = await currentUserId();
  if (!userId || alerts.length === 0) return;
  await supabase.from("alerts").insert(
    alerts.map((a) => ({
      user_id: userId,
      leak_id: a.leakId,
      leak_type: a.leakType,
      amount: a.amount,
      message: a.message,
      severity: "medium",
      read: a.read,
      thread: JSON.parse(JSON.stringify(a.thread)) as Json,
      created_at: new Date(a.timestamp).toISOString(),
    })),
  );
}

export async function loadAlerts(): Promise<Alert[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("alerts")
    .select("id, leak_id, leak_type, amount, message, read, thread, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map((r) => ({
    id: r.id,
    leakId: r.leak_id ?? "",
    leakType: r.leak_type,
    amount: Number(r.amount),
    message: r.message,
    read: r.read,
    thread: (r.thread as unknown as Alert["thread"]) ?? [],
    timestamp: new Date(r.created_at),
  }));
}

export async function markAlertReadRemote(id: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("alerts").update({ read: true }).eq("id", id).eq("user_id", userId);
}

export async function markAllAlertsReadRemote(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("alerts").update({ read: true }).eq("user_id", userId).eq("read", false);
}

/* ------------------------------ Profiles ------------------------------- */
export interface ProfilePatch {
  name?: string;
  business_name?: string;
  whatsapp?: string | null;
  notify_whatsapp?: boolean;
  notify_email?: boolean;
  upload_limit?: number;
  plan?: string;
  accepted_terms_version?: string;
  accepted_terms_at?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<{ error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { error: "Not signed in" };
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  return error ? { error: error.message } : {};
}

/* ------------------------------ Audit log ------------------------------ */
export async function logAudit(event: string, detail: Record<string, unknown> = {}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  await supabase.from("audit_log").insert({
    user_id: userId,
    event,
    detail: detail as unknown as Json,
  });
}
