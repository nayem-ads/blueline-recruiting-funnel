import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { CONSENT_TEXT, Footer, Header, IconArrow, IconCheck, PHONE_DISPLAY, PHONE_TEL, StickyBar } from "@/components/site/chrome";
import { MIN_EXP_NOTE, UNDER_MIN } from "@/components/site/quick-form";
import { submitLead } from "@/lib/api/leads.functions";
import { dispatchClientNotification } from "@/lib/notifications/client-notify";
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
  { label: "Company OTR", hint: "71¢ a mile solo, newer trucks, paid weekly", badge: "Top Pay" },
  { label: "Team", hint: "85¢–90¢ a mile split, high weekly miles", badge: "Max Miles" },
  { label: "Lease Purchase", hint: "Zero down, walkaway leases, high net earnings", badge: "Independent" },
  { label: "Not sure yet", hint: "Recruiter reviews all openings in your area" },
] as const;

const EXP_ITEMS = [
  { label: "5+ years", hint: "Top pay brackets & priority routes", badge: "Priority" },
  { label: "3 to 5 years", hint: "Qualifies for 100% of carrier lanes" },
  { label: "2 to 3 years", hint: "Full carrier matching open" },
  { label: "Under 2 years", hint: "Limited carrier openings" },
] as const;

const TOTAL = 4;

function QuizOptionCard({
  label,
  hint,
  badge,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  hint?: string;
  badge?: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-pressed={selected}
      disabled={disabled}
      className={`bl-option ${selected ? "is-selected" : ""}`}
      onClick={onClick}
    >
      <div className="bl-option-left">
        <div className="bl-radio">
          <div className="bl-radio__dot" />
        </div>
        <div className="bl-option__body">
          <div className="bl-option__title-row">
            <span>{label}</span>
            {badge ? <span className="bl-option__badge">{badge}</span> : null}
          </div>
          {hint ? <small>{hint}</small> : null}
        </div>
      </div>
      <IconArrow />
    </button>
  );
}

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
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => bindContactClicks(), []);
  useEffect(() => {
    if (step === 1 && typeof window !== "undefined") track("InitiateCheckout", { source: "quiz" });
  }, [step]);
  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [step]);

  const onPickLane = (chosen: string) => {
    if (isAdvancing) return;
    setLane(chosen);
    setIsAdvancing(true);
    setTimeout(() => {
      setStep(2);
      setIsAdvancing(false);
    }, 160);
  };

  const onPickExp = (chosen: string) => {
    if (isAdvancing) return;
    setExp(chosen);
    setIsAdvancing(true);
    setTimeout(() => {
      if (chosen === UNDER_MIN) {
        setStep(99);
      } else {
        setStep(3);
      }
      setIsAdvancing(false);
    }, 160);
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

    // 1. Direct front-end notification dispatch (HubSpot + optional Webhook, zero MCP needed)
    dispatchClientNotification({
      source: "quiz",
      fullName: fullName.trim(),
      firstName,
      lastName,
      phone: phoneClean,
      zip: zip.trim(),
      lane,
      experience: exp,
      consent,
    }).catch((e) => console.warn("[apply] client notify warning:", e));

    // 2. Server RPC (persists to D1 and Postgres)
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
      console.warn("[apply] RPC server warning (non-fatal):", err);
    }
    navigate({ to: "/applied", search: { n: firstName, src: "quiz" } });
  }

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

          <p className="bl-quiz__step">
            {step === 99 ? (
              <span>EXPERIENCE CHECK</span>
            ) : step === 4 ? (
              <>
                <span>STEP 4 OF {TOTAL}</span>
                <span className="bl-quiz__step-final"><IconCheck /> 95% Completed</span>
              </>
            ) : (
              <span>STEP {step} OF {TOTAL}</span>
            )}
          </p>

          {step === 1 ? (
            <div className="bl-quiz__step-content" key="step-1">
              <h1>What are you looking for?</h1>
              <p className="bl-quiz__hint">Pick what fits best right now. Your recruiter can adjust anytime on the call.</p>
              <div className="bl-options" role="radiogroup">
                {LANES.map((item) => (
                  <QuizOptionCard
                    key={item.label}
                    label={item.label}
                    hint={item.hint}
                    badge={"badge" in item ? item.badge : undefined}
                    selected={lane === item.label}
                    disabled={isAdvancing}
                    onClick={() => onPickLane(item.label)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="bl-quiz__step-content" key="step-2">
              <h1>How much CDL-A experience do you have?</h1>
              <p className="bl-quiz__hint">Verifiable OTR Class A time. Our carriers require 2+ years and age 23+.</p>
              <div className="bl-options" role="radiogroup">
                {EXP_ITEMS.map((item) => (
                  <QuizOptionCard
                    key={item.label}
                    label={item.label}
                    hint={item.hint}
                    badge={"badge" in item ? item.badge : undefined}
                    selected={exp === item.label}
                    disabled={isAdvancing}
                    onClick={() => onPickExp(item.label)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 99 ? (
            <div className="bl-quiz__step-content" key="step-99">
              <h1>Not quite yet</h1>
              <p className="bl-quiz__hint">{MIN_EXP_NOTE}</p>
              <div className="bl-final__row">
                <a href={PHONE_TEL} className="bl-cta-primary" data-track="click_call">Call {PHONE_DISPLAY}</a>
                <button type="button" className="bl-cta-call" onClick={() => setStep(2)}>Change my answer</button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="bl-quiz__step-content" key="step-3">
              <h1>What is your home ZIP code?</h1>
              <p className="bl-quiz__hint">We match you directly with carriers hiring out of your home region.</p>
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
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && zip.trim().length === 5) {
                        e.preventDefault();
                        setStep(4);
                      }
                    }}
                  />
                </label>
                {zip.trim().length === 5 ? (
                  <div className="bl-quiz__zip-success">
                    <IconCheck />
                    <span>Hiring lanes verified for your area</span>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="bl-cta-submit"
                disabled={zip.trim().length < 5}
                onClick={() => setStep(4)}
              >
                Continue to final step →
              </button>
            </div>
          ) : null}

          {step === 4 ? (
            <form className="bl-quiz__step-content" key="step-4" onSubmit={onSubmit} noValidate>
              <h1>Where should your recruiter call?</h1>
              <p className="bl-quiz__hint">
                Enter your info below. A dedicated BlueLine recruiter calls you in ~5 minutes with matched pay and routes.
              </p>
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

              <div className="bl-quiz__reassurance">
                <div className="bl-quiz__reassurance-item">
                  <strong>🔒 100% Confidential</strong>
                  <span>Current boss never notified</span>
                </div>
                <div className="bl-quiz__reassurance-item">
                  <strong>⏱️ 5-Min Callback</strong>
                  <span>Direct call from (816) line</span>
                </div>
                <div className="bl-quiz__reassurance-item">
                  <strong>💵 Always Free</strong>
                  <span>Zero fees or deductions</span>
                </div>
              </div>

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
                {busy ? "Securing your matches..." : "View Lane Matches & Get Callback →"}
              </button>
              <p className="bl-note" style={{ textAlign: "center", marginTop: "0.65rem", marginBottom: 0, fontSize: "0.82rem" }}>
                ⚡ High-paying lanes filling today. 2-minute call, zero obligation.
              </p>
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
