import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({ meta: [{ title: "Terms of Service · Grey Analytics" }] }),
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Last Updated: {new Date().toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">1. Acceptance of Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              These Terms of Service ("Terms") govern your use of the Grey Analytics AI financial auditing web application, portal, and automated alert services. By accessing or utilizing Grey Analytics, you agree to be bound by these Terms.
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
            <CardTitle className="text-xl">5. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              To the maximum extent permitted by South African law, Grey Analytics and its affiliates shall not be liable for indirect, incidental, special, or consequential damages, or loss of profits or revenues, arising from reliance on automated audit estimates or delays in third-party notification delivery channels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">6. Governing Law & Jurisdiction</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the South African courts.
            </p>
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
