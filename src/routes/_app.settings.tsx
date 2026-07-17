import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { deleteMyAccount } from "@/lib/account.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import {
  listConnections,
  startConnect,
  disconnect,
  type ConnectionStatus,
} from "@/lib/accounting/client";
import type { AccountingProvider } from "@/services/accounting/types";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings · Grey Analytics" }] }),
  component: SettingsPage,
});

// Static metadata for providers we render in the Integrations card. The
// `connected` flag is hydrated from /api/accounting/status at mount.
const ACCOUNTING_META: Array<{ id: AccountingProvider; name: string; desc: string }> = [
  { id: "xero", name: "Xero", desc: "OAuth 2.0 · syncs bank transactions" },
  { id: "quickbooks", name: "QuickBooks", desc: "Intuit OAuth · syncs purchases" },
  { id: "sage", name: "Sage", desc: "Sage Business Cloud · syncs bank transactions" },
];

const EXTRA_INTEGRATIONS = [
  { name: "Bank Statement (PDF)", desc: "Upload manually", connected: true },
  { name: "WhatsApp Business", desc: "Receive alerts and send invoices", connected: true },
];

function SettingsPage() {
  const { user, logout, role, updateProfile } = useApp();
  const navigate = useNavigate();
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [biz, setBiz] = useState(user?.businessName ?? "");
  const [notifyWa, setNotifyWa] = useState(user?.notifyWhatsapp ?? true);
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [uploadLimit, setUploadLimit] = useState<number>(user?.uploadLimit ?? 5);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [acct, setAcct] = useState<ConnectionStatus[]>([]);
  const [loadingAcct, setLoadingAcct] = useState(true);
  const [busy, setBusy] = useState<AccountingProvider | null>(null);
  const deleteAccount = useServerFn(deleteMyAccount);

  // Keep local state in sync when profile hydrates.
  useEffect(() => {
    if (!user) return;
    setWhatsapp(user.whatsapp ?? "");
    setName(user.name);
    setBiz(user.businessName);
    setNotifyWa(user.notifyWhatsapp);
    setNotifyEmail(user.notifyEmail);
    setUploadLimit(user.uploadLimit);
  }, [user]);

  // Hydrate accounting connection status + surface OAuth callback results.
  useEffect(() => {
    listConnections()
      .then(setAcct)
      .catch((err) => console.warn("[settings] listConnections failed:", err))
      .finally(() => setLoadingAcct(false));

    const params = new URLSearchParams(window.location.search);
    const integ = params.get("integration");
    const status = params.get("status");
    const err = params.get("error");
    if (integ && status === "connected") toast.success(`${integ} connected`);
    if (integ && err) toast.error(`${integ}: ${err}`);
    if (integ) window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function statusFor(id: AccountingProvider) {
    return acct.find((c) => c.provider === id);
  }

  async function handleConnect(p: AccountingProvider) {
    setBusy(p);
    try { await startConnect(p); } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start OAuth");
      setBusy(null);
    }
  }
  async function handleDisconnect(p: AccountingProvider) {
    setBusy(p);
    try {
      await disconnect(p);
      setAcct((arr) => arr.map((c) => c.provider === p ? { ...c, connected: false } : c));
      toast.success(`${p} disconnected`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Disconnect failed");
    } finally { setBusy(null); }
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateProfile({
      name: name.trim(),
      business_name: biz.trim(),
      whatsapp: whatsapp.trim() || null,
      upload_limit: Math.min(100, Math.max(1, uploadLimit || 5)),
    });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else toast.success("Account updated");
  }

  async function handleSaveNotifications(next: { notify_whatsapp?: boolean; notify_email?: boolean }) {
    const res = await updateProfile(next);
    if (res.error) toast.error(res.error);
  }

  async function handleDeleteAccount() {
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? All reports, uploads and alerts will be permanently removed.")) return;
    setDeleting(true);
    try {
      await deleteAccount({});
      toast.success("Account deleted");
      await logout();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }


  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Account, integrations, and alert preferences.</p>
        </div>
        <PWAInstallButton size="sm" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>How we identify you and your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid sm:grid-cols-2 gap-4" onSubmit={handleSaveAccount}>
            <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="biz">Business name</Label><Input id="biz" value={biz} onChange={(e) => setBiz(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={user?.email ?? ""} readOnly disabled /></div>
            <div className="space-y-1.5"><Label htmlFor="wa">WhatsApp number</Label><Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+27 ..." /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ulim">Upload limit (1 – 100)</Label>
              <Input id="ulim" type="number" min={1} max={100} value={uploadLimit}
                onChange={(e) => setUploadLimit(Number(e.target.value))} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect your accounting tools so Grey Analytics can pull data automatically.</CardDescription>
        </CardHeader>
        {/* Edited by Copilot: Improved mobile responsiveness for integrations list
            Reason: Settings page integrations layout was too clustered on smaller
            devices (Galaxy Z Fold 344px width). Changed from horizontal flex layout
            to improved grid/block structure on mobile to better accommodate smaller
            screens and prevent horizontal overflow. */}
        <CardContent className="divide-y divide-border">
          {ACCOUNTING_META.map((it) => {
            const s = statusFor(it.id);
            const connected = Boolean(s?.connected);
            const isBusy = busy === it.id;
            return (
              <div key={it.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="size-10 rounded-lg bg-muted grid place-items-center font-semibold text-xs flex-shrink-0">{it.name.slice(0, 2)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-medium text-sm">{it.name}</span>
                    {loadingAcct ? (
                      <Badge variant="outline" className="gap-1 text-[10px] w-fit"><Loader2 className="size-3 animate-spin" />Checking</Badge>
                    ) : connected ? (
                      <Badge className="bg-success text-success-foreground hover:bg-success gap-1 text-[10px] w-fit"><CheckCircle2 className="size-3" />Connected</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] w-fit"><AlertTriangle className="size-3" />Not connected</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
                  {role === "accountant" && connected && s?.expiresAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">Token expires: {new Date(s.expiresAt).toLocaleString("en-ZA")}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={connected ? "outline" : "default"}
                  className="w-full sm:w-auto"
                  disabled={isBusy}
                  onClick={() => connected ? handleDisconnect(it.id) : handleConnect(it.id)}
                >
                  {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            );
          })}
          {EXTRA_INTEGRATIONS.map((it) => (
            <div key={it.name} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
              <div className="size-10 rounded-lg bg-muted grid place-items-center font-semibold text-xs flex-shrink-0">{it.name.slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="font-medium text-sm">{it.name}</span>
                  <Badge className="bg-success text-success-foreground hover:bg-success gap-1 text-[10px] w-fit"><CheckCircle2 className="size-3" />Connected</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{it.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how Grey Analytics alerts you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Label htmlFor="wa-alerts">WhatsApp alerts for leaks over R2,000</Label>
              <p className="text-xs text-muted-foreground mt-1">Sent within 24 hours of detection.</p>
            </div>
            <Switch id="wa-alerts" checked={notifyWa} className="flex-shrink-0"
              onCheckedChange={(v) => { setNotifyWa(v); void handleSaveNotifications({ notify_whatsapp: v }); }} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <Label htmlFor="email-alerts">Email alerts for high-severity findings</Label>
              <p className="text-xs text-muted-foreground mt-1">Delivered via Resend to your account email.</p>
            </div>
            <Switch id="email-alerts" checked={notifyEmail} className="flex-shrink-0"
              onCheckedChange={(v) => { setNotifyEmail(v); void handleSaveNotifications({ notify_email: v }); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          {/* Edited by Copilot: Replaced em-dash (—) with space
              Reason: Remove all em-dashes rendered on UI for consistent text
              rendering across all device sizes and improved mobile responsiveness */}
          <CardDescription>Delete your account and all data (POPIA deleted within 30 days).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="gap-2" onClick={handleDeleteAccount} disabled={deleting}>
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
