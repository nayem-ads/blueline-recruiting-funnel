/** Client-only helpers. Every function guards for SSR. */
export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  landing_path?: string;
  page_uri?: string;
  schedule?: string;
};

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

/** Reads UTM/fbclid from the URL, persists first-touch in sessionStorage, returns the merged set. */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const currentPath = window.location.pathname;
  const out: Attribution = {
    page_uri: window.location.href,
    landing_path: currentPath,
  };
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(window.sessionStorage.getItem("bl_attr") || "{}");
  } catch {
    stored = {};
  }

  // Persist first landing path
  if (stored.landing_path) {
    out.landing_path = stored.landing_path;
  } else {
    stored.landing_path = currentPath;
    out.landing_path = currentPath;
  }

  const params = new URLSearchParams(window.location.search);
  for (const k of KEYS) {
    const v = params.get(k) || stored[k];
    if (v) {
      out[k] = v;
      stored[k] = v;
    }
  }

  if (stored.schedule) {
    out.schedule = stored.schedule;
  }

  try {
    window.sessionStorage.setItem("bl_attr", JSON.stringify(stored));
  } catch {
    /* private mode */
  }
  return out;
}

export function persistSchedule(schedule: string) {
  if (typeof window === "undefined" || !schedule) return;
  try {
    const stored = JSON.parse(window.sessionStorage.getItem("bl_attr") || "{}");
    stored.schedule = schedule;
    window.sessionStorage.setItem("bl_attr", JSON.stringify(stored));
  } catch {}
}

type Fbq = (...args: unknown[]) => void;
type DL = Record<string, unknown>[];

const lastFired: Record<string, number> = {};

export function track(event: "Lead" | "InitiateCheckout" | "Contact", data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const key = `${event}_${JSON.stringify(data ?? {})}`;
  // Deduplication guard against double-firing (e.g. delegated listener + bubbling or React StrictMode double effect)
  if (lastFired[key] && now - lastFired[key] < 800) {
    return;
  }
  lastFired[key] = now;

  const w = window as unknown as { fbq?: Fbq; dataLayer?: DL };
  try {
    w.fbq?.("track", event, data ?? {});
  } catch {
    /* pixel blocked */
  }
  try {
    (w.dataLayer = w.dataLayer || []).push({ event: `bl_${event.toLowerCase()}`, ...(data ?? {}) });
  } catch {
    /* noop */
  }
}

let leadTrackedOnce = false;
export function trackLeadOnce(data?: Record<string, unknown>) {
  if (leadTrackedOnce) return;
  leadTrackedOnce = true;
  track("Lead", data);
}

let formStartTracked = false;
export function trackFormStartOnce() {
  if (formStartTracked || typeof window === "undefined") return;
  formStartTracked = true;
  const w = window as unknown as { fbq?: Fbq; dataLayer?: DL };
  try {
    w.fbq?.("trackCustom", "FormStart");
  } catch {}
  try {
    (w.dataLayer = w.dataLayer || []).push({ event: "bl_formstart" });
  } catch {}
}

export function trackLeadUnqualified(reason: "experience" | "schedule") {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fbq?: Fbq; dataLayer?: DL };
  try {
    w.fbq?.("trackCustom", "LeadUnqualified", { reason });
  } catch {}
  try {
    (w.dataLayer = w.dataLayer || []).push({ event: "bl_leadunqualified", reason });
  } catch {}
}

/** Delegated click tracking for tel:/sms: links (data-track attr). Singleton guard ensures exactly once. */
let isContactBound = false;
export function bindContactClicks(): () => void {
  if (typeof document === "undefined") return () => {};
  if (isContactBound) return () => {};
  isContactBound = true;

  const onClick = (e: MouseEvent) => {
    const el = (e.target as HTMLElement | null)?.closest?.("[data-track]") as HTMLElement | null;
    if (!el) return;
    const kind = el.getAttribute("data-track");
    if (kind === "click_call" || kind === "click_text") {
      track("Contact", { method: kind === "click_text" ? "sms" : "call" });
    }
  };
  document.addEventListener("click", onClick, { capture: true });
  return () => {
    document.removeEventListener("click", onClick, { capture: true });
    isContactBound = false;
  };
}
