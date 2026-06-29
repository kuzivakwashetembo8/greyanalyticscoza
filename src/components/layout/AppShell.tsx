import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Upload, Bell, Settings, LogOut, ShieldCheck, Lock, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useApp } from "@/context/AppContext";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, setRole, logout, alerts } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unread = alerts.filter((a) => !a.read).length;

  // logout is now async (real Supabase sign-out). Await before navigating.
  const handleLogout = async () => { await logout(); navigate({ to: "/login" }); };

  return (
    <div className="min-h-dvh flex bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="size-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">G</div>
            <div>
              <div className="font-semibold leading-tight">Grey Analytics</div>
              <div className="text-xs text-sidebar-foreground/60">AI audit for SMMEs</div>
            </div>
          </Link>
          <button className="md:hidden p-1.5 rounded hover:bg-sidebar-accent" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <n.icon className="size-4" />
                <span className="flex-1">{n.label}</span>
                {n.to === "/alerts" && unread > 0 && (
                  <span className="text-xs bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">{unread}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="text-xs space-y-1.5 text-sidebar-foreground/70">
            <div className="flex items-center gap-2"><ShieldCheck className="size-3.5 text-success" /> POPIA compliant</div>
            <div className="flex items-center gap-2"><Lock className="size-3.5 text-success" /> AES-256 · TLS 1.3</div>
          </div>
          <PWAInstallButton variant="outline" className="w-full text-xs h-8 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground font-semibold border-none" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-sidebar-accent text-sidebar-foreground/80"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
            <button className="md:hidden p-2 -ml-2 rounded hover:bg-muted" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="hidden sm:block">
              <div className="text-sm font-medium">{user?.businessName}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-full" role="group" aria-label="Role">
                {(["Free", "Premium"] as const).map((r, idx) => (
                  <button
                    key={r}
                    onClick={() => {
                      if (r === "Premium") {
                        toast.info("Premium Tier: Coming Soon", { description: "Unlocks more document support (up to 100), comprehensive forensic analysis, and priority queue." });
                      }
                    }}
                    className={cn(
                      "px-3 py-1 text-xs font-medium rounded-full transition",
                      idx === 0 ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-pressed={idx === 0}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Link to="/alerts" className="relative p-2 rounded-md hover:bg-muted" aria-label="Alerts">
                <Bell className="size-5" />
                {unread > 0 && <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />}
              </Link>
              <div className="size-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold" aria-hidden>
                {user?.name?.[0] ?? "G"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1440px] w-full mx-auto">{children}</main>

        <footer className="border-t border-border px-4 sm:px-6 py-4 text-xs text-muted-foreground">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-success" /> POPIA Compliant</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-success" /> AES-256 at rest · TLS 1.3 in transit</span>
            <span>Data hosted in South Africa</span>
            <span className="ml-auto">© {new Date().getFullYear()} Grey Analytics</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
