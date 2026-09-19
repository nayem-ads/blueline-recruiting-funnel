import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { submitLead } from "@/lib/api/leads.functions";
import { dispatchClientNotification } from "@/lib/notifications/client-notify";
import { getAttribution, persistSchedule, trackFormStartOnce } from "@/lib/tracking";
import { CONSENT_TEXT } from "./chrome";

export const EXPERIENCE_OPTIONS = ["Under 2 years", "2 to 3 years", "3 to 5 years", "5+ years"] as const;
export const UNDER_MIN = "Under 2 years";
export const MIN_EXP_NOTE = "Right now our carriers need 2 years of verifiable CDL-A experience. If you are close, call us and we will tell you exactly when you qualify.";

export const SCHEDULE_OPTIONS = [
  { value: "otr_3w", label: "3 WEEKS OTR & 3–4 DAYS AT HOME" },
  { value: "otr_4w", label: "4 WEEKS OTR & 4–5 DAYS AT HOME" },
  { value: "home_weekly", label: "I need to be home weekly or daily" },
] as const;

export function QuickForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [exp, setExp] = useState("");
  // consent default state pending compliance review
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const attr = getAttribution();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!schedule) next.schedule = "Pick the schedule you want";
    if (!fullName.trim()) next.fullName = "Tell us your full name";
    const phoneClean = phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
    if (phoneClean.length !== 10) next.phone = "Enter a 10-digit US mobile number";
    if (!exp) next.exp = "Pick the closest option";
    if (!consent) next.consent = "Tick the box so a recruiter can call and text you";
    setErrors(next);
    if (Object.keys(next).length) return;

    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setBusy(true);

    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "Driver";
    const lastName = parts.slice(1).join(" ") || "";

    const isQualified =
      (schedule === "otr_3w" || schedule === "otr_4w") &&
      (exp === "2 to 3 years" || exp === "3 to 5 years" || exp === "5+ years");

    const unqualifiedReason: "experience" | "schedule" =
      exp === "Under 2 years" ? "experience" : "schedule";

    // 1. Direct front-end notification dispatch (HubSpot + email with qualification status)
    dispatchClientNotification({
      source: "quick",
      fullName: fullName.trim(),
      firstName,
      lastName,
      phone: phoneClean,
      experience: exp || "2 to 3 years",
      schedule,
      qualified: isQualified,
      unqualifiedReason: isQualified ? undefined : unqualifiedReason,
      consent,
    }).catch((e) => console.warn("[quick-form] client notify warning:", e));

    // 2. Server RPC (persists to D1 and Postgres)
    try {
      await submitLead({
        data: {
          source: "quick",
          full_name: fullName.trim(),
          first_name: firstName,
          last_name: lastName,
          phone: phoneClean,
          experience: exp || "2 to 3 years",
          schedule,
          qualified: isQualified,
          sms_consent: consent,
          consent_text: CONSENT_TEXT,
          website: honeypot,
          ...attr,
        },
      });
    } catch (err) {
      console.warn("[quick-form] RPC server warning (non-fatal):", err);
    }

    if (isQualified) {
      navigate({ to: "/applied", search: { n: firstName, src: "quick" } });
    } else {
      navigate({ to: "/applied-notyet", search: { reason: unqualifiedReason, n: firstName, src: "quick" } });
    }
  }

  return (
    <form className="bl-form-card" onSubmit={onSubmit} onFocusCapture={trackFormStartOnce} noValidate>
      {!compact ? (
        <>
          <h3>Apply in 60 seconds</h3>
          <p className="bl-note">Pick your schedule. A recruiter calls you back in 5 minutes. 2+ years CDL-A experience and age 23+ required.</p>
        </>
      ) : null}

      {/* Schedule choice card group */}
      <div className="bl-field" role="radiogroup" aria-label="Schedule choice">
        <span style={{ fontSize: "0.85rem", color: "var(--bl-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Pick the schedule you want.
        </span>
        <input type="hidden" name="schedule" value={schedule} />
        <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.45rem" }}>
          {SCHEDULE_OPTIONS.map((opt) => {
            const isSel = schedule === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSel}
                aria-pressed={isSel}
                onClick={() => {
                  setSchedule(opt.value);
                  persistSchedule(opt.value);
                  if (errors.schedule) setErrors((prev) => ({ ...prev, schedule: "" }));
                }}
                className={`bl-option ${isSel ? "is-selected" : ""}`}
                style={{
                  minHeight: "52px",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div className="bl-option-left">
                  <div className="bl-radio">
                    <div className="bl-radio__dot" />
                  </div>
                  <span style={{ fontFamily: "var(--bl-display)", fontWeight: 700, fontSize: "1.05rem", textTransform: "uppercase", letterSpacing: "0.02em" }}>
                    {opt.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {errors.schedule ? <p className="bl-err">{errors.schedule}</p> : null}
      </div>

      <label className="bl-field">
        <span>Full name</span>
        <input
          className="bl-input"
          name="full_name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          aria-invalid={!!errors.fullName}
          placeholder="e.g. Mike Smith"
        />
        {errors.fullName ? <p className="bl-err">{errors.fullName}</p> : null}
      </label>
      <label className="bl-field">
        <span>Mobile number</span>
        <input
          className="bl-input"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-invalid={!!errors.phone}
          placeholder="(555) 555-5555"
        />
        {errors.phone ? <p className="bl-err">{errors.phone}</p> : null}
      </label>
      <label className="bl-field">
        <span>CDL-A experience</span>
        <select className="bl-select" name="experience" value={exp} onChange={(e) => setExp(e.target.value)} aria-invalid={!!errors.exp}>
          <option value="">Choose one</option>
          {EXPERIENCE_OPTIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {errors.exp ? <p className="bl-err">{errors.exp}</p> : null}
      </label>

      {/* Hidden inputs */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, opacity: 0, height: 0 }} />
      <input type="hidden" name="landing_path" value={attr.landing_path ?? ""} />
      <input type="hidden" name="utm_source" value={attr.utm_source ?? ""} />
      <input type="hidden" name="utm_medium" value={attr.utm_medium ?? ""} />
      <input type="hidden" name="utm_campaign" value={attr.utm_campaign ?? ""} />
      <input type="hidden" name="utm_content" value={attr.utm_content ?? ""} />
      <input type="hidden" name="utm_term" value={attr.utm_term ?? ""} />
      <input type="hidden" name="fbclid" value={attr.fbclid ?? ""} />

      <label className="bl-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {CONSENT_TEXT}{" "}
          <a href="https://www.linerecruiting.com/privacy" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", color: "inherit" }}>
            Privacy Policy
          </a>
          .
        </span>
      </label>
      {errors.consent ? <p className="bl-err" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>{errors.consent}</p> : null}
      <button className="bl-cta-submit" type="submit" disabled={busy}>
        {busy ? "Sending" : "Get my callback"}
      </button>
      <p className="bl-note" style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.85rem" }}>
        Free for drivers. No fees, ever. Your number is never sold.
      </p>
    </form>
  );
}
