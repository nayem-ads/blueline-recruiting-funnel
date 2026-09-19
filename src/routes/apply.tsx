import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { CONSENT_TEXT, Footer, Header, IconArrow, IconCheck, PHONE_DISPLAY, PHONE_TEL, StickyBar } from "@/components/site/chrome";
import { submitLead } from "@/lib/api/leads.functions";
import { dispatchClientNotification } from "@/lib/notifications/client-notify";
import { bindContactClicks, getAttribution, persistSchedule, track, trackFormStartOnce } from "@/lib/tracking";

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
  { label: "Company OTR", hint: "71¢ a mile solo, well-maintained trucks, paid weekly", badge: "Top Pay" },
  { label: "Team", hint: "85¢–90¢ a mile split, high weekly miles", badge: "Max Miles" },
  { label: "Lease Purchase", hint: "Ask your recruiter what's available", badge: "Independent" },
  { label: "Not sure yet", hint: "Your recruiter walks you through the OTR options on the call" },
] as const;

const SCHEDULE_ITEMS = [
  { value: "otr_3w", label: "3 WEEKS OTR & 3–4 DAYS AT HOME" },
  { value: "otr_4w", label: "4 WEEKS OTR & 4–5 DAYS AT HOME" },
  { value: "home_weekly", label: "I need to be home weekly or daily" },
] as const;

const EXP_ITEMS = [
  { label: "5+ years", hint: "Top pay brackets & priority routes", badge: "Priority" },
  { label: "3 to 5 years", hint: "Qualifies for 100% of carrier lanes" },
  { label: "2 to 3 years", hint: "Full carrier matching open" },
  { label: "Under 2 years", hint: "Our carriers require 2+ years — we'll keep your details" },
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
  const [schedule, setSchedule] = useState("");
  const [exp, setExp] = useState("");
  const [zip, setZip] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // consent default state pending compliance review
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const attr = getAttribution();

  useEffect(() => bindContactClicks(), []);

  // Meta InitiateCheckout event fires here on Step 1 of the /apply quiz
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

  const onPickSchedule = (chosen: string) => {
    if (isAdvancing) return;
    setSchedule(chosen);
    persistSchedule(chosen);
    setIsAdvancing(true);
    setTimeout(() => {
      setStep(3);
      setIsAdvancing(false);
    }, 160);
  };

  const onPickExp = (chosen: string) => {
    if (isAdvancing) return;
    setExp(chosen);
    setIsAdvancing(true);
    setTimeout(() => {
      setStep(4);
      setIsAdvancing(false);
    }, 160);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Tell us your full name";
    const phoneClean = phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1");
    if (phoneClean.length !== 10) next.phone = "Enter a 10-digit US mobile number";
    const zipClean = zip.replace(/\D/g, "").slice(0, 5);
    if (zipClean.length !== 5) next.zip = "Enter a 5-digit ZIP code";
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

    // 1. Direct front-end notification dispatch (HubSpot + email)
    dispatchClientNotification({
      source: "quiz",
      fullName: fullName.trim(),
      firstName,
      lastName,
      phone: phoneClean,
      zip: zipClean,
      lane,
      experience: exp,
      schedule,
      qualified: isQualified,
      unqualifiedReason: isQualified ? undefined : unqualifiedReason,
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
          zip: zipClean,
          lane,
          experience: exp,
          schedule,
          qualified: isQualified,
          sms_consent: consent,
          consent_text: CONSENT_TEXT,
          website: honeypot,
          ...attr,
        },
      });
    } catch (err) {
      console.warn("[apply] RPC server warning (non-fatal):", err);
    }

    if (isQualified) {
      navigate({ to: "/applied", search: { n: firstName, src: "quiz" } });
    } else {
      navigate({ to: "/applied-notyet", search: { reason: unqualifiedReason, n: firstName, src: "quiz" } });
    }
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
            {step === 4 ? (
              <>
                <span>STEP 4 OF {TOTAL}</span>
                <span className="bl-quiz__step-final"><IconCheck /> 95% Completed</span>
              </>
            ) : (
              <span>STEP {step} OF {TOTAL}</span>
            )}
          </p>

          {/* Step 1: Lane */}
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

          {/* Step 2: Schedule */}
          {step === 2 ? (
            <div className="bl-quiz__step-content" key="step-2">
              <h1>Pick the schedule you want.</h1>
              <p className="bl-quiz__hint">Choose the home time cadence that matches your lifestyle.</p>
              <div className="bl-options" role="radiogroup">
                {SCHEDULE_ITEMS.map((item) => (
                  <QuizOptionCard
                    key={item.value}
                    label={item.label}
                    selected={schedule === item.value}
                    disabled={isAdvancing}
                    onClick={() => onPickSchedule(item.value)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Step 3: Experience */}
          {step === 3 ? (
            <div className="bl-quiz__step-content" key="step-3">
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

          {/* Step 4: Contact & Home ZIP */}
          {step === 4 ? (
            <form className="bl-quiz__step-content" key="step-4" onSubmit={onSubmit} onFocusCapture={trackFormStartOnce} noValidate>
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

              <label className="bl-field">
                <span>Home ZIP code</span>
                <input
                  className="bl-input"
                  name="zip"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  placeholder="e.g. 75001"
                  autoComplete="postal-code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                  aria-invalid={!!errors.zip}
                />
                <p className="bl-note" style={{ fontSize: "0.85rem", marginTop: "0.25rem", color: "var(--bl-muted)" }}>
                  Tell us where home is. Carriers pick you up near home; you run across the states.
                </p>
                {errors.zip ? <p className="bl-err">{errors.zip}</p> : null}
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

              {/* Hidden inputs */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, opacity: 0, height: 0 }} />
              <input type="hidden" name="schedule" value={schedule} />
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
                {busy ? "Securing your matches..." : "View Lane Matches & Get Callback →"}
              </button>
              <p className="bl-note" style={{ textAlign: "center", marginTop: "0.65rem", marginBottom: 0, fontSize: "0.82rem" }}>
                ⚡ High-paying lanes filling today. 2-minute call, zero obligation.
              </p>
            </form>
          ) : null}

          <div className="bl-quiz__nav">
            {step > 1 ? (
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
