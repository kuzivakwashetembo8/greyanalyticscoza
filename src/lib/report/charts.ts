// Derive chart data per agent page from the structured analysis.
// We choose four distinct chart types — one per agent — so each page tells
// its story visually, per the Inspection Export spec.
//   finance     -> pie  (anomaly category distribution)
//   operations  -> bar  (anomaly severity counts)
//   compliance  -> area (issue accumulation by severity weight)
//   strategy    -> line (rolling 6-month cashflow trend, derived from confidence
//                       + anomaly count as a deterministic mock proxy)

import type { AgentId, AgentResult } from "@/lib/analysis/types";

export type ChartKind = "pie" | "bar" | "area" | "line";

export interface ChartSpec {
  kind: ChartKind;
  title: string;
  /** Generic shape suitable for Recharts <Pie>/<Bar>/<Area>/<Line>. */
  data: Array<Record<string, string | number>>;
  /** Keys to plot — first is the X axis category, rest are series values. */
  xKey: string;
  series: Array<{ key: string; label: string }>;
}

const CHART_KIND: Record<AgentId, ChartKind> = {
  finance: "pie",
  operations: "bar",
  compliance: "area",
  strategy: "line",
};

const CHART_TITLE: Record<AgentId, string> = {
  finance: "Finance leak categories",
  operations: "Operations finding severity",
  compliance: "Compliance exposure over time",
  strategy: "Cashflow trajectory (6-month)",
};

export function chartFor(agent: AgentId, result: AgentResult | undefined): ChartSpec {
  if (!result) {
    return {
      kind: CHART_KIND[agent],
      title: CHART_TITLE[agent],
      data: [],
      xKey: "name",
      series: [{ key: "value", label: "Value" }],
    };
  }

  if (agent === "finance") {
    // Group anomalies by `type` for category distribution.
    const buckets = new Map<string, number>();
    result.anomalies.forEach((a) => buckets.set(a.type, (buckets.get(a.type) ?? 0) + 1));
    const data = [...buckets.entries()].map(([name, value]) => ({ name, value }));
    return { kind: "pie", title: CHART_TITLE[agent], data, xKey: "name", series: [{ key: "value", label: "Findings" }] };
  }

  if (agent === "operations") {
    const counts = { high: 0, medium: 0, low: 0 } as Record<string, number>;
    result.anomalies.forEach((a) => (counts[a.severity] = (counts[a.severity] ?? 0) + 1));
    const data = [
      { name: "High", value: counts.high },
      { name: "Medium", value: counts.medium },
      { name: "Low", value: counts.low },
    ];
    return { kind: "bar", title: CHART_TITLE[agent], data, xKey: "name", series: [{ key: "value", label: "Findings" }] };
  }

  if (agent === "compliance") {
    // Synthesise a 6-month accumulation curve weighted by severity. Deterministic
    // from the result so re-renders don't jitter.
    const weight = result.anomalies.reduce(
      (sum, a) => sum + (a.severity === "high" ? 3 : a.severity === "medium" ? 2 : 1),
      0,
    );
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const data = months.map((m, i) => ({
      name: m,
      exposure: Math.round((weight * (i + 1)) / months.length),
    }));
    return { kind: "area", title: CHART_TITLE[agent], data, xKey: "name", series: [{ key: "exposure", label: "Exposure" }] };
  }

  // strategy
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const base = 180 + Math.round(result.confidence * 40);
  const drag = result.anomalies.length * 6;
  const data = months.map((m, i) => ({
    name: m,
    inflow: base + i * 4,
    outflow: base - 20 + i * 6 + (i > 2 ? drag : 0),
  }));
  return {
    kind: "line",
    title: CHART_TITLE[agent],
    data,
    xKey: "name",
    series: [
      { key: "inflow", label: "Inflow (R'000)" },
      { key: "outflow", label: "Outflow (R'000)" },
    ],
  };
}
