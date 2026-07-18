import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Grey Analytics — AI-assisted financial document analysis" },
    { name: "application-name", content: "Grey Analytics" },
    { name: "description", content: "Grey Analytics is a web application that analyses uploaded business financial documents for anomalies and produces evidence-based reports and optional alerts." },
    { property: "og:site_name", content: "Grey Analytics" },
    { property: "og:title", content: "Grey Analytics — AI-assisted financial document analysis" },
    { property: "og:description", content: "Upload bank statements, accounting exports, invoices and spreadsheets for AI-assisted anomaly detection, evidence references and plain-language reports." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Grey Analytics — AI-assisted financial document analysis" },
    { name: "twitter:description", content: "A web application for analysing uploaded business financial documents and producing evidence-based reports." },
  ], links: [{ rel: "canonical", href: "https://greyanalytics.co.za/" }] }),
  component: WelcomePage,
});

function WelcomePage() {
  const { user } = useApp();
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-dvh flex flex-col lg:grid lg:grid-cols-2 bg-background">
      {/* Mobile/Tablet Header button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <img src="/icon-512x512.png" alt="Grey Analytics Logo" className="size-8 rounded-lg object-cover" />
          <span className="font-bold">Grey Analytics</span>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton size="sm" variant="outline" />
          <Button size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </div>

      {/* Left Branding Panel */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-sidebar text-sidebar-foreground relative overflow-hidden flex-1">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#166534_1px,transparent_1px)] [background-size:16px_1px]" aria-hidden />
        
        <div className="hidden lg:flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <img src="/icon-512x512.png" alt="Grey Analytics" className="size-10 rounded-xl shadow-md object-cover" />
            <span className="font-bold text-xl tracking-tight">Grey Analytics</span>
          </div>
          <PWAInstallButton variant="outline" className="bg-sidebar-accent/50 text-sidebar-foreground border-sidebar-border hover:bg-sidebar-accent" />
        </div>

        <div className="relative z-10 my-auto py-12 lg:py-0 space-y-6 max-w-lg">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-tight">
            <span className="block">Grey Analytics</span>
            <span className="block mt-2 text-2xl sm:text-3xl lg:text-4xl text-sidebar-foreground/90">
              AI-assisted financial document analysis for South African businesses
            </span>
          </h1>
          <p className="text-sidebar-foreground/80 text-base sm:text-lg leading-relaxed">
            Grey Analytics is a web application for South African SMMEs and their authorised accountants. Users upload bank statements, accounting exports, invoices and spreadsheets; the application extracts the supplied data, checks it with four specialist AI agents, and produces evidence-based findings, estimated savings and plain-language reports.
          </p>
          <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
            Grey Analytics supports internal financial review and anomaly detection. It does not provide a statutory audit, legal opinion or tax-practitioner service, and users should verify findings against their source records.
          </p>
          <div className="pt-2 grid gap-3 text-sm text-sidebar-foreground/90">
            <div className="flex items-center gap-2.5"><CheckCircle2 className="size-4 text-success" /> Automated VAT, UIF & payroll leak detection</div>
            <div className="flex items-center gap-2.5"><CheckCircle2 className="size-4 text-success" /> Instant plain-English fix-it plans & ROI estimates</div>
            <div className="flex items-center gap-2.5"><CheckCircle2 className="size-4 text-success" /> Real-time WhatsApp & Email leak notifications</div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-sidebar-border/40 flex flex-wrap items-center justify-between gap-4 text-xs text-sidebar-foreground/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-success" /> POPIA-aligned controls</span>
            <span className="flex items-center gap-1.5"><Lock className="size-4 text-success" /> Private storage · HTTPS</span>
            <Link to="/privacy-policy" className="hover:underline ml-2">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
          </div>
          <Link to="/prod-readiness" className="hover:underline">Production System Readiness Matrix</Link>
        </div>
      </div>

      {/* Desktop Right Action Panel */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-background">
        <div className="max-w-md w-full text-center space-y-8 p-8 rounded-2xl border border-border bg-card shadow-sm">
          <img src="/icon-512x512.png" alt="Grey Analytics" className="size-20 rounded-2xl mx-auto shadow-lg object-cover" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Get Started with Grey Analytics</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account or launch a fresh financial inspection.</p>
          </div>
          <div className="space-y-3 pt-2">
            <Button size="lg" className="w-full gap-2 text-base font-semibold" asChild>
              <Link to="/login">Proceed to Portal <ArrowRight className="size-4" /></Link>
            </Button>
            <PWAInstallButton className="w-full hover:bg-transparent hover:text-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
