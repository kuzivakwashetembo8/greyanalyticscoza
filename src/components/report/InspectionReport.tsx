// Inspection Export — read-only report renderer.
// Layout: a stack of 5 "pages" (CSS aspect-ratio'd cards on desktop) with
// branding header/footer. The wrapping element carries the class
// `ga-print-area` which the print stylesheet uses to isolate output.

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartFor, type ChartSpec } from "@/lib/report/charts";
import type { ReportNarrative } from "@/lib/report/types";
import { type AgentId } from "@/lib/analysis/types";
import logoAsset from "@/assets/ga-logo.png.asset.json";

const PIE_COLORS = ["#0f766e", "#84cc16", "#f59e0b", "#ef4444", "#6366f1", "#a3a3a3"];

function ChartBlock({ spec }: { spec: ChartSpec }) {
  if (!spec.data.length) {
    return (
      <div className="h-48 grid place-items-center text-sm text-muted-foreground border border-dashed rounded-md">
        No chart data available.
      </div>
    );
  }
  return (
    <figure className="w-full" aria-label={spec.title}>
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {spec.title}
      </figcaption>
      <div className="w-full h-64 print:h-56">
        <ResponsiveContainer width="100%" height="100%">
          {spec.kind === "pie" ? (
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={spec.data} dataKey="value" nameKey={spec.xKey} outerRadius="80%" label>
                {spec.data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : spec.kind === "bar" ? (
            <BarChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {spec.series.map((s, i) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </BarChart>
          ) : spec.kind === "area" ? (
            <AreaChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {spec.series.map((s, i) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PIE_COLORS[i % PIE_COLORS.length]} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.25} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={spec.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={spec.xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              {spec.series.map((s, i) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function PageHeader({ report, pageNum, total }: { report: ReportNarrative; pageNum: number; total: number }) {
  return (
    <header className="flex items-center justify-between border-b border-border pb-3 mb-5">
      <div className="flex items-center gap-3">
        <img src={logoAsset.url} alt="Grey Analytics" className="size-9 object-contain" />
        <div>
          <div className="text-sm font-bold tracking-tight">Grey Analytics</div>
          <div className="text-[11px] text-muted-foreground">{report.businessName}</div>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground text-right">
        <div>Inspection Export</div>
        <div>Page {pageNum} of {total}</div>
      </div>
    </header>
  );
}

function PageFooter({ report }: { report: ReportNarrative }) {
  return (
    <footer className="mt-6 pt-3 border-t border-border text-[10px] text-muted-foreground flex justify-between">
      <span>Generated {new Date(report.generatedAt).toLocaleString()}</span>
      <span>Confidential — for internal SMME use</span>
    </footer>
  );
}

function SeverityPill({ s }: { s?: string }) {
  if (!s) return null;
  const cls = s === "high"
    ? "bg-destructive/10 text-destructive border-destructive/30"
    : s === "medium"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${cls}`}>{s}</span>
  );
}

export function InspectionReport({ report }: { report: ReportNarrative }) {
  return (
    <article className="ga-print-area space-y-8" aria-label="Grey Analytics inspection report">
      {report.pages.map((page, i) => {
        const isSummary = page.agent === "summary";
        const spec = !isSummary ? chartFor(page.agent as AgentId, report.analyses[page.agent as AgentId]) : null;
        return (
          <section
            key={i}
            className="ga-report-page bg-card text-card-foreground border border-border rounded-lg p-6 sm:p-8 shadow-sm"
            aria-label={`${page.title}, page ${i + 1}`}
          >
            <PageHeader report={report} pageNum={i + 1} total={report.pages.length} />
            <h1 className="text-2xl font-bold tracking-tight mb-1">{page.title}</h1>
            <p className="text-sm text-muted-foreground mb-5">Page {i + 1} of {report.pages.length}</p>

            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Summary</h2>
            <p className="leading-relaxed mb-5">{page.summary}</p>

            {spec && (
              <div className="mb-6">
                <ChartBlock spec={spec} />
              </div>
            )}

            {page.anomalies.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Anomalies ({page.anomalies.length})
                </h2>
                <ul className="space-y-3">
                  {page.anomalies.map((a, j) => (
                    <li key={j} className="rounded-md border border-border p-3">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold">{a.title}</span>
                        <SeverityPill s={a.severity} />
                      </div>
                      <p className="text-sm">{a.description}</p>
                      {a.fix && (
                        <p className="text-sm mt-1.5">
                          <span className="font-semibold text-success">Fix: </span>{a.fix}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {page.insights.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Key insights</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {page.insights.map((s, k) => <li key={k}>{s}</li>)}
                </ul>
              </div>
            )}

            {page.roadmap && page.roadmap.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Strategic roadmap</h2>
                <ul className="space-y-1.5 text-sm">
                  {page.roadmap.map((r, k) => (
                    <li key={k} className="flex gap-2">
                      <span className="font-semibold uppercase text-[10px] tracking-wide bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0 self-start mt-0.5">
                        {r.horizon}
                      </span>
                      <span>{r.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <PageFooter report={report} />
          </section>
        );
      })}
    </article>
  );
}
