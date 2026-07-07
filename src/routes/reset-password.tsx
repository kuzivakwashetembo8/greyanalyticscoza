import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Set a new password · Grey Analytics" },
    { name: "description", content: "Choose a new password for your Grey Analytics account." },
    { name: "robots", content: "noindex" },
  ]}),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Supabase places the recovery session in URL hash on arrival. Wait for the
  // client to hydrate before allowing the update.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Signing you in…");
    navigate({ to: "/dashboard" });
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
            <h1 className="text-2xl font-semibold">Set a new password</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose a strong password of at least 8 characters.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete="new-password" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Confirm password</Label>
              <Input id="pw2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} autoComplete="new-password" required />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading || !ready}>
              {loading ? "Updating…" : (<><KeyRound className="size-4" /> Update password</>)}
            </Button>
            {!ready && <p className="text-xs text-muted-foreground">Verifying reset link…</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}