import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { submitLead } from "@/lib/api/leads.functions";
import { getAttribution } from "@/lib/tracking";
import { CONSENT_TEXT } from "./chrome";

export const EXPERIENCE_OPTIONS = ["Under 2 years", "2 to 3 years", "3 to 5 years", "5+ years"] as const;
export const UNDER_MIN = "Under 2 years";
export const MIN_EXP_NOTE = "Right now our carriers need 2 years of verifiable CDL-A experience. If you are close, call us and we will tell you exactly when you qualify.";

export function QuickForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [exp, setExp] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
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

    try {
      await submitLead({
        data: {
          source: "quick",
          full_name: fullName.trim(),
          first_name: firstName,
          last_name: lastName,
          phone: phoneClean,
          experience: exp || "2 to 3 years",
          sms_consent: consent,
          consent_text: CONSENT_TEXT,
          website: honeypot,
          ...getAttribution(),
        },
      });
    } catch (err) {
      console.warn("[quick-form] RPC warning, firing direct HubSpot fallback:", err);
      try {
        await fetch("https://api.hsforms.com/submissions/v3/integration/submit/50966263/a09aa246-2380-4477-b243-f04c799c3457", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fields: [
              { objectTypeId: "0-1", name: "firstname", value: firstName },
              { objectTypeId: "0-1", name: "lastname", value: lastName || "-" },
              { objectTypeId: "0-1", name: "phone", value: `+1${phoneClean}` },
              { objectTypeId: "0-1", name: "experience", value: exp || "2 to 3 years" },
              { objectTypeId: "0-1", name: "sms_permission", value: consent ? "true" : "false" },
            ],
            context: {
              pageUri: typeof window !== "undefined" ? window.location.href : "https://linerecruiting.com/",
              pageName: "BlueLine quick apply",
            },
          }),
        });
      } catch (clientErr) {
        console.warn("[quick-form] direct HubSpot fallback caught:", clientErr);
      }
    }
    navigate({ to: "/applied", search: { n: firstName, src: "quick" } });
  }

  return (
    <form className="bl-form-card" onSubmit={onSubmit} noValidate>
      {!compact ? (
        <>
          <h3>Apply in 60 seconds</h3>
          <p className="bl-note">Three fields. A recruiter calls you back in 5 minutes. 2+ years CDL-A experience required.</p>
        </>
      ) : null}
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
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, opacity: 0, height: 0 }} />
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
