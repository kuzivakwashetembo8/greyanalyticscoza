import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton({ className, variant = "outline", size = "default" }: { className?: string; variant?: any; size?: any }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.info("Install Grey Analytics", {
        description: "To install this app on your device, use your browser's 'Add to Home Screen' or 'Install' option in the menu."
      });
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      toast.success("Installing app...");
    }
    setDeferredPrompt(null);
  };

  return (
    <Button variant={variant} size={size} onClick={handleInstall} className={`${className || ""} hover:bg-background hover:text-foreground`}>
      <Download className="size-4 mr-2" /> Install App
    </Button>
  );
}