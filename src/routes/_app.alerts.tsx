import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Video, MoreVertical, Send, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { formatZAR, type Alert } from "@/lib/mock";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "WhatsApp alerts · Grey Analytics" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { alerts, markAlertRead } = useApp();
  const [selected, setSelected] = useState<Alert | null>(alerts[0] ?? null);

  if (alerts.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="size-14 rounded-full bg-muted grid place-items-center mx-auto mb-3">📱</div>
        <h2 className="text-lg font-semibold">No alerts yet</h2>
        <p className="text-muted-foreground">When we find a leak over R2,000 we'll send a WhatsApp alert here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">WhatsApp alerts</h1>
        <p className="text-muted-foreground mt-1">Urgent leaks pinged to your phone within 24 hours.</p>
      </div>

      <div className="grid md:grid-cols-[340px_1fr] gap-4 rounded-xl border border-border overflow-hidden bg-card min-h-[60dvh]">
        {/* List */}
        <div className={cn("border-b md:border-b-0 md:border-r border-border bg-muted/20", selected ? "hidden md:block" : "block")}>
          <div className="p-3 border-b border-border bg-card">
            <h2 className="font-semibold text-sm">Chats ({alerts.length})</h2>
          </div>
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => { setSelected(a); markAlertRead(a.id); }}
                  className={cn("w-full text-left p-3 flex gap-3 hover:bg-muted/60 transition", selected?.id === a.id && "bg-muted")}
                >
                  <div className="size-10 rounded-full bg-whatsapp text-whatsapp-foreground grid place-items-center font-semibold shrink-0">G</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium">Grey Analytics</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(a.timestamp, { addSuffix: false })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate flex-1">{a.message}</p>
                      {!a.read && <span className="size-2 rounded-full bg-whatsapp shrink-0" />}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Detail */}
        {selected ? (
          <div className="flex flex-col" style={{ background: "color-mix(in oklab, var(--color-whatsapp) 6%, var(--color-background))" }}>
            <header className="flex items-center gap-3 p-3 border-b border-border bg-card">
              <button className="md:hidden text-sm text-muted-foreground" onClick={() => setSelected(null)}>‹ Back</button>
              <div className="size-9 rounded-full bg-whatsapp text-whatsapp-foreground grid place-items-center font-semibold">G</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Grey Analytics</div>
                <div className="text-xs text-muted-foreground">online · WhatsApp Business</div>
              </div>
              <button aria-label="Voice call" className="p-2 hover:bg-muted rounded-full"><Phone className="size-4" /></button>
              <button aria-label="Video call" className="p-2 hover:bg-muted rounded-full"><Video className="size-4" /></button>
              <button aria-label="More" className="p-2 hover:bg-muted rounded-full"><MoreVertical className="size-4" /></button>
            </header>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="text-center">
                <Badge variant="secondary" className="text-[10px]">{format(selected.timestamp, "EEEE, d MMM yyyy")}</Badge>
              </div>
              {selected.thread.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "owner" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] sm:max-w-[65%] px-3 py-2 rounded-2xl text-sm shadow-sm relative",
                    m.from === "owner"
                      ? "bg-whatsapp text-whatsapp-foreground rounded-br-sm"
                      : "bg-card rounded-bl-sm",
                  )}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className={cn("text-[10px] mt-1 block text-right opacity-70", m.from === "owner" && "text-whatsapp-foreground/80")}>
                      {format(m.at, "HH:mm")} {m.from === "owner" && <CheckCheck className="size-3 inline ml-0.5" />}
                    </span>
                  </div>
                </div>
              ))}

              <div className="flex justify-start">
                <div className="max-w-[80%] sm:max-w-[65%] px-3 py-2 rounded-2xl rounded-bl-sm bg-card text-sm shadow-sm">
                  <div className="text-xs font-semibold text-destructive mb-1">⚠️ {selected.leakType}</div>
                  <p className="text-2xl font-bold tabular-nums">{formatZAR(selected.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap "View report" in the app to see the full fix steps.</p>
                  <span className="text-[10px] mt-1 block text-right text-muted-foreground">{format(selected.timestamp, "HH:mm")}</span>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                placeholder="Type a message (demo)"
                className="flex-1 px-3 py-2 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Message"
              />
              <button className="size-9 rounded-full bg-whatsapp text-whatsapp-foreground grid place-items-center" aria-label="Send">
                <Send className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden md:grid place-items-center text-muted-foreground p-10 text-sm">Select an alert to read it.</div>
        )}
      </div>
    </div>
  );
}
