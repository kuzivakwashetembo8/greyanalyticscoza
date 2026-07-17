// Mock data + utils for Grey Analytics demo
export type Role = "owner" | "accountant";
export type LeakCategory = "Finance" | "Ops" | "Compliance" | "Strategy";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  businessName: string;
  whatsapp: string;
}

export interface Upload {
  id: string;
  fileName: string;
  size: string;
  uploadedAt: Date;
  status: "processing" | "ready" | "failed";
  source: "PDF" | "CSV" | "Excel" | "Image";
}

export interface Leak {
  id: string;
  type: string;
  amount: number;
  description: string;
  evidence: string[];
  fix: string[];
  category: LeakCategory;
  severity: "high" | "medium" | "low";
}

export interface Report {
  id: string;
  title: string;
  businessName: string;
  generatedAt: Date;
  executiveSummary: string;
  leaks: Leak[];
  fixSteps: string[];
  roi: { currentSpend: number; potentialSavings: number; recoveryMonths: number };
  readability: { grade: number; label: string };
  monthly: { month: string; spend: number; savings: number }[];
}

export interface Alert {
  id: string;
  leakId: string;
  leakType: string;
  amount: number;
  message: string;
  timestamp: Date;
  read: boolean;
  thread: { from: "system" | "owner"; text: string; at: Date }[];
}

const BUSINESSES = [
  "Khanya's Catering", "Bay Auto Repairs", "Sisanda Spaza", "Mthatha Logistics",
  "Amathole Construction", "Buffalo City Bakery", "PE Fresh Produce", "Wild Coast Crafts",
];

const FIRST = ["Thando", "Nomvula", "Sipho", "Lerato", "Bongani", "Zinhle", "Andile", "Naledi"];
const LAST = ["Nkosi", "Dlamini", "Mbeki", "Mokoena", "Khumalo", "Mahlangu"];

const LEAK_TEMPLATES: Omit<Leak, "id" | "amount">[] = [
  {
    type: "Duplicate Supplier Payment",
    description: "We found the same invoice from Boxer Wholesale paid twice in October.",
    evidence: ["Invoice #INV-4421 paid on 03 Oct (R12,480)", "Invoice #INV-4421 paid again on 17 Oct (R12,480)", "Bank reference matches both EFTs"],
    fix: ["Call Boxer Wholesale and ask for a refund of R12,480", "Turn on duplicate-payment lock in Xero", "Set a weekly check for repeat invoice numbers"],
    category: "Finance",
    severity: "high",
  },
  {
    type: "Missed Early-Payment Discount",
    description: "Your top supplier offers 2.5% off if paid within 10 days. You paid late 6 times this quarter.",
    evidence: ["6 invoices paid 14–22 days late", "Average invoice value R8,200", "Discount lost: R1,230"],
    fix: ["Schedule supplier payments weekly", "Add reminders 7 days before due date", "Negotiate Net-15 terms"],
    category: "Ops",
    severity: "medium",
  },
  {
    type: "VAT Output Miscalculation",
    description: "Three sales invoices charged 14% VAT instead of 15%. SARS will ask for the difference.",
    evidence: ["Invoice #S-882 – charged 14%", "Invoice #S-901 – charged 14%", "Invoice #S-915 – charged 14%"],
    fix: ["Issue credit notes and reissue with 15% VAT", "Update invoice template in Sage", "Review VAT settings monthly"],
    category: "Compliance",
    severity: "high",
  },
  {
    type: "Overtime Spike",
    description: "Workshop overtime jumped 38% in November with no extra revenue.",
    evidence: ["112 OT hours vs 81 in October", "No new jobs booked", "3 staff > 20 OT hours each"],
    fix: ["Review job scheduling for November", "Cap individual overtime at 15 hours", "Track jobs per hour weekly"],
    category: "Ops",
    severity: "medium",
  },
  {
    type: "Inactive Subscription",
    description: "You are paying for a stock-control app nobody has logged into for 4 months.",
    evidence: ["Last login: 12 July 2025", "R899 charged monthly", "No active users"],
    fix: ["Cancel the subscription today", "Move stock tracking into Xero (free)", "Review all subs every quarter"],
    category: "Finance",
    severity: "low",
  },
  {
    type: "Unbilled Job",
    description: "A repair job for Coega Holdings was completed but never invoiced.",
    evidence: ["Job #JC-238 marked complete 02 Nov", "No invoice in Xero", "Quoted at R7,600"],
    fix: ["Issue invoice today", "Connect job-card system to Xero", "Daily check for closed jobs without invoices"],
    category: "Strategy",
    severity: "high",
  },
  {
    type: "Late UIF Submission",
    description: "UIF for October was filed 11 days late. Penalty applies.",
    evidence: ["Due: 7 November", "Submitted: 18 November", "10% penalty + interest"],
    fix: ["Pay penalty before next cycle", "Set automatic reminder on the 1st", "Authorise a backup signer"],
    category: "Compliance",
    severity: "medium",
  },
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const SESSION_SEED = Math.floor(Math.random() * 1_000_000);
const rand = seeded(SESSION_SEED);

function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function id() { return Math.random().toString(36).slice(2, 10); }

export function mockUser(role: Role = "owner"): MockUser {
  const first = pick(FIRST);
  const last = pick(LAST);
  const business = pick(BUSINESSES);
  return {
    id: "u_" + id(),
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}@${business.toLowerCase().replace(/[^a-z]/g, "")}.co.za`,
    role,
    businessName: business,
    whatsapp: "+27 82 555 " + Math.floor(1000 + rand() * 8999),
  };
}

export function mockUploads(count = 4): Upload[] {
  const sources: Upload["source"][] = ["PDF", "CSV", "Excel", "Image"];
  const names = ["FNB-Statement-Oct.pdf", "Xero-Transactions.csv", "Payroll-Nov.xlsx", "Invoice-photo.jpg", "Sage-Export-Q3.csv", "Bank-Recon-Sep.pdf"];
  return Array.from({ length: count }).map((_, i) => ({
    id: "up_" + id(),
    fileName: names[i % names.length],
    size: `${(0.4 + rand() * 4).toFixed(1)} MB`,
    uploadedAt: new Date(Date.now() - i * 1000 * 60 * 60 * (4 + rand() * 30)),
    status: i === 0 ? "processing" : (rand() > 0.15 ? "ready" : "failed"),
    source: pick(sources),
  }));
}

export function mockLeaks(count = 5): Leak[] {
  const shuffled = [...LEAK_TEMPLATES].sort(() => rand() - 0.5).slice(0, count);
  // Ensure at least one leak > R2,000
  return shuffled.map((t, i) => {
    const base = i === 0 ? 2500 + rand() * 14000 : 400 + rand() * 9500;
    return { ...t, id: "lk_" + id(), amount: Math.round(base / 10) * 10 };
  });
}

export function mockReport(businessName?: string): Report {
  const leaks = mockLeaks(5);
  const currentSpend = 145000 + Math.round(rand() * 80000);
  const potentialSavings = leaks.reduce((s, l) => s + l.amount, 0);
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return {
    id: "rep_" + id(),
    title: "Grey Analytics Audit Report",
    businessName: businessName ?? pick(BUSINESSES),
    generatedAt: new Date(),
    executiveSummary:
      "We checked your last 90 days of money in and money out. We found 5 places where cash is leaking. " +
      "The biggest leak is a duplicate supplier payment. If you fix the top 3 items this month, you can save " +
      `R${(potentialSavings).toLocaleString("en-ZA")} and cover it back within 2 months.`,
    leaks,
    fixSteps: [
      "Call the suppliers listed for refunds this week.",
      "Turn on duplicate payment lock in your accounting software.",
      "Set Friday as 'payment day' so discounts are not missed.",
      "Fix VAT settings and issue credit notes today.",
      "Cancel the unused stock-control app before next billing.",
    ],
    roi: { currentSpend, potentialSavings, recoveryMonths: 2 },
    readability: { grade: 10, label: "Grade 10 – Easy to understand" },
    monthly: months.map((m, i) => ({
      month: m,
      spend: Math.round(currentSpend / 6 + (rand() - 0.5) * 8000),
      savings: Math.round((potentialSavings / 6) * (0.4 + i * 0.18)),
    })),
  };
}

export function mockAlerts(leaks: Leak[]): Alert[] {
  return leaks
    .filter((l) => l.amount > 2000)
    .map((l, i) => ({
      id: "al_" + id(),
      leakId: l.id,
      leakType: l.type,
      amount: l.amount,
      message: `⚠️ Grey Analytics found a leak of R${l.amount.toLocaleString("en-ZA")} – ${l.type}. Tap to see the fix.`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 47),
      read: i > 1,
      thread: [
        { from: "system", text: `Hi! We found a possible leak: ${l.type}.`, at: new Date(Date.now() - i * 1000 * 60 * 47) },
        { from: "system", text: `Amount: R${l.amount.toLocaleString("en-ZA")}.`, at: new Date(Date.now() - i * 1000 * 60 * 47 + 1000) },
        { from: "system", text: `Quick fix: ${l.fix[0]}`, at: new Date(Date.now() - i * 1000 * 60 * 47 + 2000) },
      ],
    }));
}

export function formatZAR(n: number) {
  return "R" + n.toLocaleString("en-ZA", { maximumFractionDigits: 0 });
}

/**
 * Real (non-mock) empty report shell created immediately after extraction.
 * Findings, ROI, monthly and executive summary stay empty until Transmit
 * Assessment fills them in. Uses a real UUID so DB upserts stay in sync
 * with the in-memory report object.
 */
export function emptyReport(businessName?: string): Report {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? "rep_" + id()),
    title: "Grey Analytics Audit Report",
    businessName: businessName ?? "Your business",
    generatedAt: new Date(),
    executiveSummary: "",
    leaks: [],
    fixSteps: [],
    roi: { currentSpend: 0, potentialSavings: 0, recoveryMonths: 0 },
    readability: { grade: 10, label: "" },
    monthly: [],
  };
}
