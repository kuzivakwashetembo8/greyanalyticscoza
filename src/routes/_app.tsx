import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { DemoTour } from "@/components/demo/DemoTour";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  // Wait for Supabase to hydrate the session before deciding whether to
  // redirect — otherwise a hard refresh kicks signed-in users to /login.
  const { user, loading } = useApp();
  if (loading) {
    return (
      <div className="min-h-dvh grid place-items-center bg-background">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  return (
    <AppShell>
      <Outlet />
      <DemoTour />
    </AppShell>
  );
}
