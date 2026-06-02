import { Link } from "@tanstack/react-router";
import { FileText, Loader2, CheckCircle2, AlertCircle, Upload as UploadIcon, TrendingDown, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatZAR } from "@/lib/mock";
import { formatDistanceToNow } from "date-fns";

export function UploadStatusCard() {
  const { uploads } = useApp();
  const recent = uploads.slice(0, 4);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent uploads</CardTitle>
          <CardDescription>Your latest financial documents</CardDescription>
        </div>
        <Button asChild size="sm" variant="outline"><Link to="/upload"><UploadIcon className="size-4 mr-1.5" />Upload</Link></Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No uploads yet.</p>}
        {recent.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/60">
            <div className="size-9 rounded bg-muted grid place-items-center"><FileText className="size-4 text-muted-foreground" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{u.fileName}</div>
              <div className="text-xs text-muted-foreground">{u.size} · {formatDistanceToNow(u.uploadedAt, { addSuffix: true })}</div>
            </div>
            {u.status === "processing" && <Badge variant="secondary" className="gap-1"><Loader2 className="size-3 animate-spin" />Processing</Badge>}
            {u.status === "ready" && <Badge className="gap-1 bg-success text-success-foreground hover:bg-success"><CheckCircle2 className="size-3" />Ready</Badge>}
            {u.status === "failed" && <Badge variant="destructive" className="gap-1"><AlertCircle className="size-3" />Failed</Badge>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReportListCard() {
  const { reports } = useApp();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Generated audit reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No reports yet — run an audit.</p>}
        {reports.map((r) => (
          <Link key={r.id} to="/report/$id" params={{ id: r.id }} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted/60 transition">
            <div className="size-9 rounded bg-primary/10 text-primary grid place-items-center"><FileText className="size-4" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.businessName} · {formatDistanceToNow(r.generatedAt, { addSuffix: true })}</div>
            </div>
            <Badge variant="outline">{r.leaks.length} leaks</Badge>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function LeakSummaryCard() {
  const { reports } = useApp();
  const top = (reports[0]?.leaks ?? []).slice().sort((a, b) => b.amount - a.amount).slice(0, 3);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top leaks this month</CardTitle>
        <CardDescription>Money you can recover</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {top.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Run an audit to see leaks.</p>}
        {top.map((l, i) => (
          <div key={l.id} className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-destructive/10 text-destructive grid place-items-center text-xs font-semibold">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{l.type}</div>
              <div className="text-xs text-muted-foreground line-clamp-1">{l.description}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-destructive">{formatZAR(l.amount)}</div>
              <div className="text-[10px] uppercase text-muted-foreground">{l.category}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
