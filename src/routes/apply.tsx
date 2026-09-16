import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { CONSENT_TEXT, Footer, Header, IconArrow, IconCheck, PHONE_DISPLAY, PHONE_TEL, StickyBar } from "@/components/site/chrome";
import { EXPERIENCE_OPTIONS, MIN_EXP_NOTE, UNDER_MIN } from "@/components/site/quick-form";
import { submitLead } from "@/lib/api/leads.functions";
import { bindContactClicks, getAttribution, track } from "@/lib/tracking";

type Search = { lane?: string };

export const Route = createFileRoute("/apply")({
  validateSearch: (s: Record<string, unknown>): Search => ({ lane: typeof s.lane === "string" ? s.lane : undefined }),
  head: () => ({
    meta: [
      { title: "Apply in 60 seconds | BlueLine Recruiting" },
      { name: "description", content: "Four quick questions, then a real recruiter calls you in 5 minutes. Free for CDL-A drivers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Apply,
});

const LANES = [
  ["Company OTR", "71¢ a mile solo, well-maintained truck, paid weekly"],
  ["Team", "85 to 90¢ a mile for the team, consistent freight"],
  ["Lease purchase", "More control, bigger upside on good miles"],
  ["Not sure yet", "Your recruiter walks you through what is open"],
] as const;

const EXP_ITEMS = [
  ["5+ years", "Top pay brackets & priority routes"],
  ["3 to 5 years", "Qualifies for all carrier lanes"],
  ["2 to 3 years", "Full carrier matching open"],
  ["Under 2 years", "Limited carrier openings"],
] as const;

const TOTAL = 4;

function Apply() {
  const { lane: laneParam } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(laneParam ? 2 : 1);
  const [lane, setLane] = useState(laneParam ?? "");
  const [exp, setExp] = useState("");
  const [zip, setZip] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => bindContactClicks(), []);
  useEffect(() => {
    if (step === 1 && typeof window !== "undefined") track("InitiateCheckout", { source: "quiz" });
  }, [step]);
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [step]);

  const pick = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setStep((s) => Math.min(s + 1, TOTAL));
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Tell us your full name";
    const phoneClean = phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
    if (phoneClean.length !== 10) next.phone = "Enter a 10-digit US mobile number";
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
          source: "quiz",
          full_name: fullName.trim(),
          first_name: firstName,
          last_name: lastName,
          phone: phoneClean,
          zip: zip.trim(),
          lane,
          experience: exp,
          sms_consent: consent,
          consent_text: CONSENT_TEXT,
          website: honeypot,
          ...getAttribution(),
        },
      });
    } catch (err) {
      console.warn("[apply] RPC warning, firing direct HubSpot fallback:", err);
      try {
        await fetch("https://api.hsforms.com/submissions/v3/integration/submit/50966263/a09aa246-2380-4477-b243-f04c799c3457", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            fields: [
              { objectTypeId: "0-1", name: "firstname", value: firstName },
              { objectTypeId: "0-1", name: "lastname", value: lastName || "-" },
              { objectTypeId: "0-1", name: "phone", value: `+1${phoneClean}` },
              { objectTypeId: "0-1", name: "driver_interest", value: lane },
              { objectTypeId: "0-1", name: "experience", value: exp },
              { objectTypeId: "0-1", name: "zip", value: zip.trim() },
              { objectTypeId: "0-1", name: "sms_permission", value: consent ? "true" : "false" },
            ],
            context: {
              pageUri: typeof window !== "undefined" ? window.location.href : "https://linerecruiting.com/apply",
              pageName: "BlueLine 4-step driver quiz",
            },
          }),
        });
      } catch (clientErr) {
        console.warn("[apply] direct HubSpot fallback caught:", clientErr);
      }
    }
    navigate({ to: "/applied", search: { n: firstName, src: "quiz" } });
  }

  const Options = ({ items, value, onPick }: { items: readonly (readonly [string, string])[]; value: string; onPick: (v: string) => void }) => (
    <div className="bl-options" role="radiogroup">
      {items.map(([label, hint]) => {
        const selected = value === label;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-pressed={selected}
            className="bl-option"
            onClick={() => onPick(label)}
          >
            <div className="bl-option-left">
              <div className="bl-radio">
                <div className="bl-radio__dot" />
              </div>
              <div className="bl-option__body">
                <span>{label}</span>
                {hint ? <small>{hint}</small> : null}
              </div>
            </div>
            <IconArrow />
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      <Header cta={false} />
      <main className="bl-quiz bl-page-end">
        <div className="bl-wrap bl-quiz__card">
          <div className="bl-segments" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={TOTAL}>
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`bl-segment ${s <= step ? "is-active" : ""}`} />
            ))}
          </div>
          <p className="bl-quiz__step">{step === 99 ? "EXPERIENCE CHECK" : `STEP ${step} OF ${TOTAL}`}</p>

          {step === 1 ? (
            <>
              <h1>What are you looking for?</h1>
              <p className="bl-quiz__hint">Pick the closest one. Your recruiter can adjust on the call.</p>
              <Options items={LANES} value={lane} onPick={pick(setLane)} />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1>How much CDL-A experience do you have?</h1>
              <p className="bl-quiz__hint">Verifiable OTR time with a Class A. Our carriers need 2 years or more.</p>
              <Options
                items={EXP_ITEMS}
                value={exp}
                onPick={(v) => {
                  setExp(v);
                  if (v === UNDER_MIN) {
                    setStep(99);
                  } else {
                    setStep(3);
                  }
                }}
              />
            </>
          ) : null}

          {step === 99 ? (
            <>
              <h1>Not quite yet</h1>
              <p className="bl-quiz__hint">{MIN_EXP_NOTE}</p>
              <div className="bl-final__row">
                <a href={PHONE_TEL} className="bl-cta-primary" data-track="click_call">Call {PHONE_DISPLAY}</a>
                <button type="button" className="bl-cta-call" onClick={() => setStep(2)}>Change my answer</button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1>What is your ZIP code?</h1>
              <p className="bl-quiz__hint">We match you directly with carriers hiring out of your area.</p>
              <div style={{ maxWidth: "280px", margin: "0 auto 1.5rem auto" }}>
                <label className="bl-field">
                  <span>5-digit ZIP code</span>
                  <input
                    className="bl-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={5}
                    placeholder="e.g. 75001"
                    autoComplete="postal-code"
                    autoFocus
                    value={zip}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                      setZip(v);
                      if (v.length === 5) {
                        setTimeout(() => setStep(4), 180);
                      }
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                className="bl-cta-submit"
                disabled={zip.length < 5}
                onClick={() => setStep(4)}
              >
                Next step
              </button>
            </>
          ) : null}

          {step === 4 ? (
            <form onSubmit={onSubmit} noValidate>
              <h1>Where should your recruiter call?</h1>
              <p className="bl-quiz__hint">A dedicated recruiter calls from a (816) number within 5 minutes.</p>
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
                  autoFocus
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
              <button className="bl-cta-submit" type="submit" disabled={busy}>{busy ? "Sending..." : "Get my callback"}</button>
            </form>
          ) : null}

          <div className="bl-quiz__nav">
            {step > 1 && step !== 99 ? (
              <button type="button" className="bl-cta-ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
            ) : <span />}
            <a className="bl-cta-ghost" href={PHONE_TEL} data-track="click_call">Rather talk? {PHONE_DISPLAY}</a>
          </div>

          <div className="bl-quiz__trust">
            <span><IconCheck /> Free for drivers</span>
            <span><IconCheck /> Number never sold</span>
            <span><IconCheck /> 5-minute callback</span>
          </div>
        </div>

        <div className="bl-quiz__bottom">
          <div className="bl-quiz__bottom-eyebrow">Free Driver Matching</div>
          <h2>Three questions. Then a real recruiter.</h2>
          <p>
            No call centers, no runaround. A dedicated recruiter reviews your lanes and experience,
            then calls you directly with openings that match.
          </p>
          <div className="bl-quiz__bottom-actions">
            <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call">Call now</a>
            <a href={PHONE_TEL} className="bl-cta-ghost" data-track="click_call">{PHONE_DISPLAY}</a>
          </div>
        </div>

        <Footer />
      </main>
      <StickyBar />
    </>
  );
}
