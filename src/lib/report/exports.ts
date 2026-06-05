// Export helpers for the Inspection Export report.
//
// PDF: we use the browser's native window.print() with @media print rules
//      (see styles.css) so charts (Recharts SVG) print without rasterisation
//      and no third-party PDF dependency is required.
// DOCX: docx-js, generated entirely in the browser. Charts are replaced with
//       indented JSON blocks per the spec.
// TXT: plain text version with the same JSON appendices.

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from "docx";
import type { ReportNarrative } from "./types";
import { reportFilename } from "./storage";
import { agentMeta, type AgentId } from "@/lib/analysis/types";
import { chartFor } from "./charts";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

// ---------- PDF (browser print) ----------
export function exportPdf(filename: string = reportFilename("pdf")) {
  const previousTitle = document.title;
  // Browser print dialogs default the suggested filename to document.title.
  document.title = filename.replace(/\.pdf$/i, "");
  // Toggle a body-level class so @media print rules know to show only the
  // report. We re-toggle on `afterprint`.
  document.body.classList.add("ga-printing");
  const cleanup = () => {
    document.body.classList.remove("ga-printing");
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

// ---------- DOCX ----------
function jsonBlockParagraphs(label: string, value: unknown): Paragraph[] {
  const text = JSON.stringify(value, null, 2);
  return [
    new Paragraph({
      children: [new TextRun({ text: label, bold: true })],
      spacing: { before: 160, after: 60 },
    }),
    ...text.split("\n").map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, font: "Courier New", size: 18 })],
        }),
    ),
  ];
}

export async function exportDocx(report: ReportNarrative, filename: string = reportFilename("docx")) {
  const children: Paragraph[] = [];

  // Cover header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "GREY ANALYTICS", bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Inspection Export — Audit Report", size: 24 })],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${report.businessName}  ·  Generated ${new Date(report.generatedAt).toLocaleString()}`, italics: true, size: 20 }),
      ],
      spacing: { after: 320 },
    }),
  );

  report.pages.forEach((page, idx) => {
    if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: `Page ${idx + 1} — ${page.title}`, bold: true })],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "Summary", bold: true })],
      }),
      new Paragraph({ children: [new TextRun(page.summary)] }),
    );

    if (page.anomalies.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Anomalies", bold: true })],
        }),
      );
      page.anomalies.forEach((a) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${a.title}`, bold: true }),
              a.severity ? new TextRun({ text: `  [${a.severity.toUpperCase()}]`, italics: true }) : new TextRun(""),
            ],
            spacing: { before: 120 },
          }),
          new Paragraph({ children: [new TextRun(a.description)] }),
          new Paragraph({ children: [new TextRun({ text: `Fix: ${a.fix}`, italics: true })] }),
        );
      });
    }

    if (page.insights.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Key insights", bold: true })],
        }),
      );
      page.insights.forEach((ins) =>
        children.push(new Paragraph({ children: [new TextRun(`• ${ins}`)] })),
      );
    }

    if (page.roadmap?.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: "Strategic roadmap", bold: true })],
        }),
      );
      page.roadmap.forEach((r) =>
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `${r.horizon.toUpperCase()}: `, bold: true }), new TextRun(r.action)],
          }),
        ),
      );
    }

    // JSON block replacing the on-screen chart.
    if (page.agent !== "summary") {
      const agent = page.agent as AgentId;
      const result = report.analyses[agent];
      const chart = chartFor(agent, result);
      children.push(
        ...jsonBlockParagraphs(`${agentMeta(agent).label} — chart data (${chart.kind})`, {
          chart: { kind: chart.kind, title: chart.title, data: chart.data, series: chart.series },
        }),
        ...jsonBlockParagraphs(`${agentMeta(agent).label} — raw agent JSON`, result ?? null),
      );
    } else {
      // Summary page — embed full analyses object.
      children.push(...jsonBlockParagraphs("Full analyses JSON", report.analyses));
    }
  });

  const doc = new Document({
    creator: "Grey Analytics",
    title: filename,
    description: "Grey Analytics Inspection Export",
    sections: [
      {
        properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, filename);
}

// ---------- TXT ----------
export function exportTxt(report: ReportNarrative, filename: string = reportFilename("txt")) {
  const L: string[] = [];
  L.push("GREY ANALYTICS — INSPECTION EXPORT");
  L.push("====================================");
  L.push(`Business : ${report.businessName}`);
  L.push(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
  L.push("");

  report.pages.forEach((page, i) => {
    L.push("");
    L.push(`PAGE ${i + 1} — ${page.title.toUpperCase()}`);
    L.push("".padEnd(60, "-"));
    L.push("");
    L.push("Summary:");
    L.push(page.summary);
    L.push("");

    if (page.anomalies.length) {
      L.push("Anomalies:");
      page.anomalies.forEach((a, j) => {
        L.push(`  ${j + 1}. ${a.title}${a.severity ? ` [${a.severity.toUpperCase()}]` : ""}`);
        L.push(`     ${a.description}`);
        L.push(`     Fix: ${a.fix}`);
      });
      L.push("");
    }
    if (page.insights.length) {
      L.push("Key insights:");
      page.insights.forEach((ins) => L.push(`  • ${ins}`));
      L.push("");
    }
    if (page.roadmap?.length) {
      L.push("Strategic roadmap:");
      page.roadmap.forEach((r) => L.push(`  • [${r.horizon}] ${r.action}`));
      L.push("");
    }

    if (page.agent !== "summary") {
      const agent = page.agent as AgentId;
      const chart = chartFor(agent, report.analyses[agent]);
      L.push("Chart data (in lieu of visual):");
      L.push(JSON.stringify({ kind: chart.kind, title: chart.title, data: chart.data, series: chart.series }, null, 2));
      L.push("");
      L.push("Raw agent JSON:");
      L.push(JSON.stringify(report.analyses[agent] ?? null, null, 2));
    } else {
      L.push("Full analyses JSON:");
      L.push(JSON.stringify(report.analyses, null, 2));
    }
    L.push("");
  });

  const blob = new Blob([L.join("\n")], { type: "text/plain;charset=utf-8" });
  download(blob, filename);
}
