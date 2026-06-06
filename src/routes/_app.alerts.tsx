import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Mail,
  MessageCircle,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { formatZAR } from "@/lib/mock";
import { clearSentAlerts, loadSentAlerts } from "@/lib/alerts/storage";
import { retrySingleAlert } from "@/lib/alerts/client";
import type { SentAlert } from "@/lib/alerts/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts · Grey Analytics" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  // Hydrate from localStorage so alert history persists across sessions.
  const [alerts, setAlerts] = useState<SentAlert[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { setAlerts(loadSentAlerts()); }, []);

  const handleRetry = async (row: SentAlert) => {
    setBusyId(row.id);
    try {
      const updated = await retrySingleAlert(row);
      setAlerts(loadSentAlerts());
      if (updated.status === "sent") toast.success(`Alert resent via ${updated.channel}`);
      else toast.error(`Retry failed: ${updated.error ?? "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = () => {
    if (!confirm("Clear local alert history?")) return;
    clearSentAlerts();
    setAlerts([]);
  };

  const sentCount = alerts.filter((a) => a.status === "sent").length;
  const failedCount = alerts.filter((a) => a.status === "failed").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            WhatsApp &amp; Email alerts sent automatically after each Transmit Assessment.
          </p>
        </div>
        {alerts.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
            <Trash2 className="size-4" />Clear history
          </Button>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard label="Total" value={alerts.length} />
          <SummaryCard label="Delivered" value={sentCount} tone="success" />
          <SummaryCard label="Failed" value={failedCount} tone={failedCount ? "destructive" : "muted"} />
        </div>
      )}

      {alerts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted grid place-items-center mx-auto">
              <MessageCircle className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No alerts yet</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              When Transmit Assessment finds an anomaly with severity <span className="font-medium">high</span> or
              an amount over <span className="font-medium">R2,000</span>, we'll send a WhatsApp + Email alert and
              record it here.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/upload">Run an assessment</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Delivery history</CardTitle>
            <CardDescription>Most recent alerts first. Failed alerts can be retried.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {alerts.map((a) => (
                <li key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div
                    className={cn(
                      "size-10 rounded-lg grid place-items-center shrink-0",
                      a.channel === "whatsapp"
                        ? "bg-whatsapp/15 text-whatsapp"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {a.channel === "whatsapp" ? <MessageCircle className="size-5" /> : <Mail className="size-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm">{a.anomalyType}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase",
                          a.severity === "high" && "border-destructive/40 text-destructive",
                          a.severity === "medium" && "border-amber-500/40 text-amber-600",
                        )}
                      >
                        {a.severity}
                      </Badge>
                      {a.status === "sent" ? (
                        <Badge className="bg-success text-success-foreground hover:bg-success gap-1 text-[10px]">
                          <CheckCircle2 className="size-3" />Sent
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <XCircle className="size-3" />Failed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {a.businessName} · {a.channel === "whatsapp" ? "WhatsApp" : "Email"} to{" "}
                      <span className="font-mono text-xs">{a.to || "(no recipient)"}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="tabular-nums font-medium text-foreground">{formatZAR(a.amount)}</span>
                      <span>·</span>
                      <span title={format(a.sentAt, "PPpp")}>
                        {formatDistanceToNow(a.sentAt, { addSuffix: true })}
                      </span>
                    </div>
                    {a.status === "failed" && a.error && (
                      <p className="text-xs text-destructive mt-1.5 flex items-start gap-1.5">
                        <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                        <span className="break-words">{a.error}</span>
                      </p>
                    )}
                  </div>

                  {a.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 self-start"
                      disabled={busyId === a.id}
                      onClick={() => handleRetry(a)}
                    >
                      <RefreshCw className={cn("size-3.5", busyId === a.id && "animate-spin")} />
                      Retry
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "success" | "destructive";
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div
          className={cn(
            "text-2xl font-bold tabular-nums mt-1",
            tone === "success" && "text-success",
            tone === "destructive" && "text-destructive",
          )}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
