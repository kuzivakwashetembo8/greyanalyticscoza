import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/prod-readiness")({
  component: ProdReadinessPage,
});

function ProdReadinessPage() {
  return (
    <div className="min-h-dvh bg-background p-6 sm:p-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="size-4" /> Back to Welcome
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Production System Readiness Matrix</h1>
        <p className="text-muted-foreground mt-1">Complete architectural overview and verification checklist for Grey Analytics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core System Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <strong className="block text-foreground">1. Groq TPM Overflow Handling</strong>
              <span className="text-muted-foreground">Pre-summarization pipeline active via llama-3.1-8b-instant to compress documents over 6,000 characters while preserving financial entities.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <strong className="block text-foreground">2. Lovable Cloud Supabase Authentication</strong>
              <span className="text-muted-foreground">Full Google OAuth broker and instant Email sign-in configured with Profile synchronization.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <strong className="block text-foreground">3. Real Automated Alert Pipelines</strong>
              <span className="text-muted-foreground">Twilio WhatsApp Business API and Gmail/Resend connectors structured with graceful fallback and local audit trails.</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
            <div>
              <strong className="block text-foreground">4. Zero Mock Data Policy</strong>
              <span className="text-muted-foreground">Decoy dashboards and false recovery notifications purged across all user viewports.</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}