import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Share2, Printer } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ExecutiveSummary, LeakCard, RoiEstimate } from "@/components/report/ReportParts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatZAR } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/report/$id")({
  head: () => ({ meta: [{ title: "Audit report · Grey Analytics" }] }),
  component: ReportPage,
  notFoundComponent: () => {
    const { id } = Route.useParams();
    return <div className="p-10 text-center text-muted-foreground">Report "{id}" not found.</div>;
  },
});

function ReportPage() {
  const { id } = Route.useParams();
  const { reports, getReport } = useApp();
  const report = id === "latest" ? reports[0] : getReport(id);
  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Report not found.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="size-3.5" />Back to dashboard</Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{report.title}</h1>
          <p className="text-muted-foreground">{report.businessName} · Generated {new Date(report.generatedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("Demo: PDF export would download here.")}><Download className="size-4 mr-1.5" />PDF</Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Demo: share link copied.")}><Share2 className="size-4 mr-1.5" />Share</Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-4 mr-1.5" />Print</Button>
        </div>
      </div>

      <ExecutiveSummary report={report} />

      <Card>
        <CardHeader>
          <CardTitle>Top {report.leaks.length} leaks</CardTitle>
          <CardDescription>Click any leak to see the evidence and the fix.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {report.leaks.map((l, i) => <LeakCard key={l.id} leak={l} index={i} />)}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><RoiEstimate report={report} /></div>
        <Card>
          <CardHeader>
            <CardTitle>Your fix-it plan</CardTitle>
            <CardDescription>Do these in order this week.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {report.fixSteps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <span className="size-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold shrink-0">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 p-3 rounded-md bg-success/10 text-sm">
              <strong className="text-success">Estimated payback: {formatZAR(report.roi.potentialSavings)}</strong> within {report.roi.recoveryMonths} months if you fix the top 3.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
