import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: { sitekey: string; size: "invisible"; callback: (token: string) => void; "error-callback": () => void; "expired-callback": () => void }) => string;
      execute: (id: string) => void;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

export type TurnstileStatus = "loading" | "missing" | "verifying" | "verified" | "failed" | "expired";

let loading: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TURNSTILE_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  return loading;
}

export function Turnstile({
  onStatus,
  onToken
}: {
  onStatus: (status: TurnstileStatus) => void;
  onToken: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
    let widgetId: string | null = null;
    let mounted = true;
    if (!sitekey) {
      onStatus("missing");
      onToken("");
      return;
    }

    onStatus("loading");

    loadTurnstile().then(() => {
      if (!mounted || !ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey,
        size: "invisible",
        callback: (token) => {
          onStatus("verified");
          onToken(token);
        },
        "error-callback": () => {
          onStatus("failed");
          onToken("");
        },
        "expired-callback": () => {
          onStatus("expired");
          onToken("");
          if (widgetId && window.turnstile) {
            window.turnstile.reset(widgetId);
            onStatus("verifying");
            window.turnstile.execute(widgetId);
          }
        }
      });
      onStatus("verifying");
      window.turnstile.execute(widgetId);
    }).catch(() => {
      onStatus("failed");
      onToken("");
    });

    return () => {
      mounted = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onStatus, onToken]);

  return <div className="turnstile-invisible" ref={ref} />;
}
