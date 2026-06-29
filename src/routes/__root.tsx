import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4 text-center">
      <div className="max-w-md">
        <div className="text-7xl font-bold text-primary">404</div>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">We could not find that page. It might have been moved.</p>
        <Link to="/dashboard" className="inline-flex mt-6 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Go to dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="min-h-dvh grid place-items-center bg-background px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head back to the dashboard.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/dashboard" className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">Dashboard</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Grey Analytics – AI audit for Eastern Cape SMMEs" },
      { name: "description", content: "Find money leaks in your business. Plain-English reports and WhatsApp alerts for Eastern Cape SMMEs." },
      { name: "author", content: "Grey Analytics" },
      { property: "og:title", content: "Grey Analytics – AI audit for Eastern Cape SMMEs" },
      { property: "og:description", content: "Find money leaks in your business. Plain-English reports and WhatsApp alerts for Eastern Cape SMMEs." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Grey Analytics – AI audit for Eastern Cape SMMEs" },
      { name: "twitter:description", content: "Find money leaks in your business. Plain-English reports and WhatsApp alerts for Eastern Cape SMMEs." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/73b07bb0-4595-44e4-bf91-54184716fa93/id-preview-8e5d20a6--cde6abf0-023f-42e1-9d7e-0fe88e5d998c.lovable.app-1780419196494.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/73b07bb0-4595-44e4-bf91-54184716fa93/id-preview-8e5d20a6--cde6abf0-023f-42e1-9d7e-0fe88e5d998c.lovable.app-1780419196494.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "manifest", href: "/manifest.json" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AppProvider>
    </QueryClientProvider>
  );
}
