/** Client-only helpers. Every function guards for SSR. */
export type Attribution = {
  utm_source?: string; utm_medium?: string; utm_campaign?: string;
  utm_content?: string; utm_term?: string; fbclid?: string; page_uri?: string;
};
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

/** Reads UTM/fbclid from the URL, persists first-touch in sessionStorage, returns the merged set. */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const out: Attribution = { page_uri: window.location.href };
  let stored: Attribution = {};
  try { stored = JSON.parse(window.sessionStorage.getItem("bl_attr") || "{}"); } catch { stored = {}; }
  const params = new URLSearchParams(window.location.search);
  for (const k of KEYS) {
    const v = params.get(k) || stored[k];
    if (v) out[k] = v;
  }
  try { window.sessionStorage.setItem("bl_attr", JSON.stringify(out)); } catch { /* private mode */ }
  return out;
}

type Fbq = (...args: unknown[]) => void;
type DL = Record<string, unknown>[];

export function track(event: "Lead" | "InitiateCheckout" | "Contact", data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: Fbq; dataLayer?: DL };
  try { w.fbq?.("track", event, data ?? {}); } catch { /* pixel blocked */ }
  try { (w.dataLayer = w.dataLayer || []).push({ event: `bl_${event.toLowerCase()}`, ...(data ?? {}) }); } catch { /* noop */ }
}

/** Delegated click tracking for tel:/sms: links (data-track attr). Call once per page mount. */
export function bindContactClicks(): () => void {
  if (typeof document === "undefined") return () => {};
  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.("[data-track]") as HTMLElement | null;
    if (!el) return;
    const kind = el.getAttribute("data-track");
    track("Contact", { method: kind === "click_text" ? "sms" : "call" });
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}
