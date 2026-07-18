import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Sign in · Grey Analytics" },
    { name: "description", content: "Sign in to Grey Analytics to run AI audits, view reports, and manage alerts for your business." },
    { property: "og:title", content: "Sign in · Grey Analytics" },
    { property: "og:description", content: "Sign in to Grey Analytics to run AI audits, view reports, and manage alerts for your business." },
    { name: "robots", content: "noindex" },
  ]}),
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp, signInWithGoogle } = useApp();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Redirect once auth state hydrates a user. Honour ?redirect=<safe path>.
  useEffect(() => {
    if (!user) return;
    const raw = search.redirect;
    const safe = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    navigate({ to: safe });
  }, [user, navigate, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !acceptTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      const res = mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password, businessName || "My Business", { whatsapp });
      if (res.error) {
        toast.error(res.error);
      } else if (mode === "signup") {
        toast.success("Account created — signing you in…");
      }
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const raw = search.redirect;
    const safe = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
    const res = await signInWithGoogle(safe);
    if (res.error) {
      toast.error(res.error);
      setLoading(false);
    }
    // On success the OAuth provider redirects; no need to clear loading.
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(800px 400px at 80% 10%, var(--color-sidebar-primary), transparent 60%)" }} aria-hidden />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <img src="/icon-512x512.png" alt="Grey Analytics" className="size-10 rounded-lg object-cover" />
            <div className="font-semibold text-lg">Grey Analytics</div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">Find money leaks in your business in plain English.</h1>
          <p className="text-sidebar-foreground/80">Four AI agents check your Xero, Sage, QuickBooks and bank statements. We tell you what to fix and how much you'll save.</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-sidebar-primary" /> 5-page audit report in under 48 hours</li>
            <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-sidebar-primary" /> WhatsApp alerts for any leak over R2,000</li>
            <li className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-sidebar-primary" /> Built for Eastern Cape SMMEs</li>
          </ul>
        </div>
        <div className="relative flex items-center gap-4 text-xs text-sidebar-foreground/70">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> POPIA-aligned controls</span>
          <span className="flex items-center gap-1.5"><Lock className="size-3.5" /> Private storage · HTTPS</span>
          <Link to="/privacy-policy" className="hover:underline ml-1">Privacy Policy</Link>
          <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <img src="/icon-512x512.png" alt="Grey Analytics" className="size-9 rounded-lg object-cover" />
              <div className="font-semibold">Grey Analytics</div>
            </div>
            <h2 className="text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
            <div className="mt-2 mb-4">
              <PWAInstallButton size="sm" variant="outline" className="w-full text-xs" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{mode === "signin" ? "Sign in to see your latest audit." : "Start finding leaks in minutes."}</p>

            <Button
              type="button"
              variant="outline"
              className="mt-5 w-full gap-2"
              onClick={() => void onGoogle()}
              disabled
              aria-describedby="google-signin-status"
            >
              <GoogleIcon /> Continue with Google
            </Button>
            <p id="google-signin-status" className="mt-2 text-center text-xs text-muted-foreground">
              Temporarily unavailable while Google completes verification.
            </p>

            <div className="my-5 flex items-center gap-3" aria-hidden>
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or use email</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="biz">Business name</Label>
                  <Input id="biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Bay Auto Repairs" required />
                </div>
              )}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="wa">WhatsApp number (optional)</Label>
                  <Input id="wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+27 82 000 0000" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.za" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required />
              </div>
              {mode === "signup" && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={acceptTerms} onCheckedChange={(v) => setAcceptTerms(v === true)} className="mt-0.5" />
                  <span>
                    I agree to the <Link to="/terms-of-service" className="text-primary hover:underline">Terms of Service</Link>{" "}
                    and <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <><span className="size-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />Please wait…</> : <>{mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="size-4" /></>}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === "signin" ? "New here? " : "Already have an account? "}
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary font-medium hover:underline">
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </div>
            {mode === "signin" && (
              <div className="mt-2 text-center text-sm">
                <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">Forgot your password?</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
