import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Grey Analytics" },
      { name: "description", content: "The terms governing access to and use of the Grey Analytics service." },
    ],
    links: [{ rel: "canonical", href: "https://greyanalytics.co.za/terms-of-service" }],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full px-6 py-12 space-y-8 animate-in fade-in duration-300">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
            <ArrowLeft className="size-4" /> Back to Welcome
          </Link>
          <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-2">
            <Scale className="size-4" /> Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Grey Analytics Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Last Updated: 19 July 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              These Terms of Service ("Terms") govern your use of Grey Analytics, an AI-assisted financial document analysis web application for South African businesses and their authorised accountants. The application extracts information from documents supplied by users, checks that information for possible financial anomalies, generates reports, and can deliver optional notifications. By accessing or using Grey Analytics, you agree to these Terms.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2. Scope of Service & Nature of Advice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Grey Analytics provides automated financial inspection, leak detection, and ROI estimation powered by artificial intelligence models. Our specialist agents assess operational, financial, compliance, and strategic indicators based solely on documents you upload.
            </p>
            <p>
              <strong className="text-foreground">Important Disclaimer:</strong> Grey Analytics is an analytical intelligence platform and does not constitute formal statutory auditing, legal representation, or registered tax practitioner counsel under the Auditing Profession Act or Tax Administration Act. Output reports are actionable guides designed to assist enterprise decision-makers and internal accountants.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. User Responsibilities & Data Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              You represent and warrant that all uploaded bank statements, accounting ledgers, and billing records are authentic, lawful documents belonging to the business entity you represent. You retain full ownership of all submitted source documentation.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">4. Upload Tiers & Usage Limits</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Document processing is limited by the server-side allowance assigned to the account plan and displayed in Settings. Users cannot raise that allowance from the browser. WhatsApp and email delivery also require valid deployment configuration.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">5. Acceptable Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>You must not upload information you are not authorised to process, attempt to bypass account limits or security controls, interfere with the service, introduce malicious code, reverse engineer protected service components, or use outputs for unlawful or misleading purposes.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">6. Accounts, Availability & Termination</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>You are responsible for safeguarding your account credentials and activity performed through your account. We may suspend access to protect users, investigate misuse, comply with law, or maintain the service.</p>
            <p>You may stop using the service at any time and may request account deletion through Settings. Features that depend on external providers may be unavailable when those providers or required deployment credentials are unavailable.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">7. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>You retain ownership of documents and information you submit. Grey Analytics and its licensors retain ownership of the application, branding, software, prompts, interfaces, and service materials. We grant you a limited, revocable right to use the service in accordance with these Terms.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              To the maximum extent permitted by South African law, Grey Analytics and its affiliates shall not be liable for indirect, incidental, special, or consequential damages, or loss of profits or revenues, arising from reliance on automated audit estimates or delays in third-party notification delivery channels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">9. Governing Law & Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the South African courts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">10. Changes & Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>We may update these Terms as the service changes. Material updates will be published on this page with a revised date. Continued use after an update constitutes acceptance of the revised Terms.</p>
            <p>Questions about these Terms may be sent to <span className="text-foreground font-mono">legal@greyanalytics.co.za</span>.</p>
          </CardContent>
        </Card>
      </div>

      <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground bg-card mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          </div>
          <span>© {new Date().getFullYear()} Grey Analytics</span>
        </div>
      </footer>
    </div>
  );
}
