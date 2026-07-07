import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Forgot password · Grey Analytics" },
    { name: "description", content: "Reset your Grey Analytics password securely by email." },
    { name: "robots", content: "noindex" },
  ]}),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setSent(true); toast.success("Reset link sent — check your inbox."); }
  };

  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
          <div className="flex items-center gap-2.5">
            <img src="/icon-512x512.png" alt="Grey Analytics" className="size-9 rounded-lg object-cover" />
            <div className="font-semibold">Grey Analytics</div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Reset your password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send a secure reset link.</p>
          </div>
          {sent ? (
            <div className="rounded-md border border-success/40 bg-success/10 p-4 text-sm">
              We sent a reset link to <span className="font-medium">{email}</span>. The link expires in 60 minutes.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.co.za" autoComplete="email" required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Sending…" : (<><Mail className="size-4" /> Send reset link</>)}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}