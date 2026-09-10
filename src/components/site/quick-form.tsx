import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { submitLead } from "@/lib/api/leads.functions";
import { getAttribution } from "@/lib/tracking";
import { CONSENT_TEXT } from "./chrome";

export const EXPERIENCE_OPTIONS = ["Under 3 months", "3 to 12 months", "1 to 2 years", "2+ years"] as const;

export function QuickForm({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [first, setFirst] = useState("");
  const [phone, setPhone] = useState("");
  const [exp, setExp] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!first.trim()) next.first = "Tell us your first name";
    if (phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1").length !== 10) next.phone = "Enter a 10-digit US mobile number";
    if (!exp) next.exp = "Pick the closest option";
    if (!consent) next.consent = "Tick the box so a recruiter can call and text you";
    setErrors(next);
    if (Object.keys(next).length) return;
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setBusy(true);
    try {
      await submitLead({
        data: { source: "quick", first_name: first, phone, experience: exp, sms_consent: consent, consent_text: CONSENT_TEXT, website: honeypot, ...getAttribution() },
      });
      navigate({ to: "/applied", search: { n: first.trim(), src: "quick" } });
    } catch {
      setErrors({ form: "Something went wrong. Call or text us instead, we answer fast." });
      setBusy(false);
    }
  }

  return (
    <form className="bl-form-card" onSubmit={onSubmit} noValidate>
      {!compact ? (
        <>
          <h3>Apply in 60 seconds</h3>
          <p className="bl-note">Three fields. A recruiter calls you back in 5 minutes.</p>
        </>
      ) : null}
      <label className="bl-field">
        <span>First name</span>
        <input className="bl-input" name="first_name" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} aria-invalid={!!errors.first} placeholder="Mike" />
        {errors.first ? <p className="bl-err">{errors.first}</p> : null}
      </label>
      <label className="bl-field">
        <span>Mobile number</span>
        <input className="bl-input" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} placeholder="(555) 555-5555" />
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
        <span>{CONSENT_TEXT}</span>
      </label>
      {errors.consent ? <p className="bl-err" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>{errors.consent}</p> : null}
      {errors.form ? <p className="bl-err" style={{ marginBottom: "0.75rem" }}>{errors.form}</p> : null}
      <button className="bl-cta-submit" type="submit" disabled={busy}>
        {busy ? "Sending" : "Get my callback"}
      </button>
      <p className="bl-note" style={{ marginTop: "0.75rem", marginBottom: 0, fontSize: "0.85rem" }}>
        Free for drivers. No fees, ever. Your number is never sold.
      </p>
    </form>
  );
}
