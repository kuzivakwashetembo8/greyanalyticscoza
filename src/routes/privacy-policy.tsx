import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy · Grey Analytics" }] }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-8 animate-in fade-in duration-300">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="size-4" /> Back to Welcome
          </Link>
          <div className="flex items-center gap-2 text-success text-sm font-semibold mb-2">
            <ShieldCheck className="size-4" /> POPIA-aligned data handling
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Effective Date: {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Introduction & POPIA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Grey Analytics ("we", "our", or "us") is dedicated to safeguarding the financial and personal data of South African Small, Medium, and Micro Enterprises (SMMEs). This Privacy Policy outlines our standards for collecting, processing, and protecting your data in strict compliance with the Protection of Personal Information Act (POPIA) No. 4 of 2013.
            </p>
            <p>
              By accessing our platform or uploading business documentation, you consent to the secure extraction and specialized analytical assessment practices detailed herein.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2. Information We Collect</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p><strong className="text-foreground">Account Information:</strong> Business name, designated representative name, email address, role, and contact phone numbers (specifically WhatsApp numbers for automated leak notifications).</p>
            <p><strong className="text-foreground">Financial Documentation:</strong> Bank statements, accounting exports (Xero, Sage, QuickBooks), payroll spreadsheets, and invoice imagery uploaded for analysis.</p>
            <p><strong className="text-foreground">Extracted Telemetry:</strong> Anonymized line items, transaction amounts, debtor days, and tax compliance indicators extracted via our Siphon Cypher pipeline.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. Bank-Grade Security & Encryption</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Original documents are stored in a private Supabase Storage bucket and access is scoped to the signed-in account. Data is transmitted over HTTPS. Encryption at rest and transport security are provided by the configured hosting and database providers; Grey Analytics does not claim a specific cipher, TLS version, or data region beyond the deployed providers' verified configuration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">4. Data Retention & Offboarding Deletion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Financial records and analysis telemetry are maintained only for the duration required to generate your audit assessments and maintain your alert historical trails.
            </p>
            <p>
              Using <strong className="text-foreground">Delete my account</strong> requests immediate deletion of private original documents followed by deletion of the account and its linked uploads, reports, alerts, settings, and audit records. If storage deletion fails, account deletion stops and reports the failure instead of claiming completion. No automatic 30-day purge schedule is currently claimed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">5. Third-Party Specialist Processors</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p><strong className="text-foreground">Supabase:</strong> authentication, database, and private original-document storage.</p>
            <p><strong className="text-foreground">Groq:</strong> AI inference for extraction, specialist analysis, summarisation, and report narrative generation. Extracted financial text may be sent to Groq when an AI operation is requested.</p>
            <p><strong className="text-foreground">Twilio:</strong> WhatsApp delivery when that channel is configured and enabled.</p>
            <p><strong className="text-foreground">Resend:</strong> email delivery when that channel is configured and enabled.</p>
            <p><strong className="text-foreground">Cloudflare:</strong> application hosting when the included Cloudflare deployment target is used. The actual deployment operator must keep this list aligned with its live configuration.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">6. Contact & Data Protection Officer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              For inquiries regarding POPIA access requests, data corrections, or permanent account deletion, please reach out to our legal compliance desk at <span className="text-foreground font-mono">privacy@greyanalytics.co.za</span>.
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground bg-card mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-success" /> POPIA-aligned controls</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-success" /> Private storage · HTTPS</span>
            <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
          </div>
          <span>© {new Date().getFullYear()} Grey Analytics</span>
        </div>
      </footer>
    </div>
  );
}
