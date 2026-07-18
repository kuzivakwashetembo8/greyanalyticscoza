import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Grey Analytics" },
      { name: "description", content: "How Grey Analytics collects, uses, protects, retains, and deletes personal and financial information." },
    ],
    links: [{ rel: "canonical", href: "https://greyanalytics.co.za/privacy-policy" }],
  }),
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Grey Analytics Privacy Policy</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Effective Date: 19 July 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Introduction & POPIA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Grey Analytics ("we", "our", or "us") is an AI-assisted financial document analysis web application for South African businesses and their authorised accountants. This Privacy Policy explains how the Grey Analytics application collects, uses, shares, protects, retains and deletes personal and financial information in accordance with applicable South African data-protection law, including POPIA.
            </p>
            <p>
              By creating an account or uploading business documentation, you acknowledge the processing practices described here. Where consent is the appropriate legal basis, we will request it through the application.
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
            <CardTitle className="text-xl">6. How We Use Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>We use account and document information to authenticate users, provide document extraction and AI-assisted analysis, generate reports, apply usage limits, deliver enabled notifications, prevent abuse, diagnose failures, and comply with legal obligations.</p>
            <p>We do not sell personal information. We do not use uploaded financial documents for unrelated advertising.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">7. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>Subject to applicable law, you may ask whether we hold your personal information, request access or correction, object to certain processing, withdraw optional notification consent, or request deletion.</p>
            <p>You may also lodge a complaint with South Africa's Information Regulator. We may need to verify your identity before completing a privacy request.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">8. Cookies, Children & Policy Changes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>Grey Analytics uses authentication and application storage required to keep users signed in and preserve product state. The service is intended for business users and is not directed to children.</p>
            <p>We may update this policy when our services or legal obligations change. Material changes will be published on this page with a revised effective date.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">9. Contact & Information Officer</CardTitle>
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
