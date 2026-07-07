import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, TrendingUp, FileText, AlertTriangle, Upload as UploadIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadStatusCard, ReportListCard, LeakSummaryCard } from "@/components/dashboard/DashboardCards";
import { formatZAR } from "@/lib/mock";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Grey Analytics" }] }),
  component: DashboardPage,
});

const AUDIT_STEPS = [
  "Connecting to Xero…",
  "Pulling 90 days of transactions…",
  "Finance agent analysing…",
  "Compliance agent checking VAT & UIF…",
  "Generating plain-English report…",
];

function DashboardPage() {
  const { user, reports, loading } = useApp();
  const navigate = useNavigate();
  const [auditing] = useState(false);

  const latest = reports[0];
  const totalSavings = latest?.roi.potentialSavings ?? 0;

  const runAudit = () => {
    navigate({ to: "/upload" });
  };

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sawubona, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Welcome to {user?.businessName || "your business"}.</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-4">
            <div className="size-14 rounded-full bg-primary/10 grid place-items-center mx-auto">
              <UploadIcon className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">No audits yet</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
                Upload a bank statement, general ledger, or Xero export to run your first audit. Your reports will appear here.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/upload"><UploadIcon className="size-4" /> Upload your first document</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sawubona, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground mt-1">Real-time financial inspection portal for {user?.businessName || "your business"}.</p>
        </div>
        <Button onClick={runAudit} disabled={auditing} size="lg" className="gap-2">
          {auditing ? <>
          </> : <>Run new audit</>}
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Recoverable cash" value={formatZAR(totalSavings)} icon={<TrendingUp className="size-4" />} accent="text-success" />
        <Kpi label="Leaks found" value={(latest?.leaks.length ?? 0).toString()} icon={<AlertTriangle className="size-4" />} accent="text-destructive" />
        <Kpi label="Reports" value={reports.length.toString()} icon={<FileText className="size-4" />} accent="text-primary" />
        <Kpi label="Last audit" value={latest ? new Date(latest.generatedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : "None"} icon={<FileText className="size-4" />} accent="text-accent-foreground" />
      </div>


      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <UploadStatusCard />
          <ReportListCard />
        </div>
        <div className="space-y-4 sm:space-y-6">
          <LeakSummaryCard />
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground">Need fresh data?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-primary-foreground/90">Upload a bank statement or Xero export and we'll run a new audit.</p>
              <Button asChild variant="secondary" className="w-full"><Link to="/upload"><UploadIcon className="size-4 mr-1.5" />Upload now<ArrowRight className="size-4 ml-1.5" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${accent}`}>{icon}<span className="text-muted-foreground">{label}</span></div>
        <div className="text-xl sm:text-2xl font-bold mt-2 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
