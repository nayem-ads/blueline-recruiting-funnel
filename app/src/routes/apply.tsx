import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { CONSENT_TEXT, Footer, Header, IconArrow, IconCheck, PHONE_DISPLAY, PHONE_TEL, StickyBar } from "@/components/site/chrome";
import { EXPERIENCE_OPTIONS } from "@/components/site/quick-form";
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
  ["Company OTR", "71¢ a mile solo, brand new truck, paid weekly"],
  ["Team", "Higher weekly totals, consistent freight"],
  ["Lease purchase", "More control, bigger upside on good miles"],
  ["Not sure yet", "Your recruiter walks you through what is open"],
] as const;
const HOME = [
  ["Out 2 to 3 weeks", "Max miles, max pay"],
  ["Home every 2 weeks", ""],
  ["Home weekly", ""],
  ["Flexible for the right pay", ""],
] as const;
const MATTERS = [
  ["Pay per mile", ""],
  ["Home time", ""],
  ["New equipment", ""],
  ["Steady miles, no sitting", ""],
] as const;
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const TOTAL = 6;

function Apply() {
  const { lane: laneParam } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(laneParam ? 2 : 1);
  const [lane, setLane] = useState(laneParam ?? "");
  const [exp, setExp] = useState("");
  const [home, setHome] = useState("");
  const [matters, setMatters] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
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
    if (!first.trim()) next.first = "Tell us your first name";
    if (phone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1").length !== 10) next.phone = "Enter a 10-digit US mobile number";
    if (!consent) next.consent = "Tick the box so a recruiter can call and text you";
    setErrors(next);
    if (Object.keys(next).length) return;
    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    setBusy(true);
    try {
      await submitLead({
        data: {
          source: "quiz", first_name: first, last_name: last, phone, state, city, lane, experience: exp, home_time: home, matters,
          sms_consent: consent, consent_text: CONSENT_TEXT, website: honeypot, ...getAttribution(),
        },
      });
      navigate({ to: "/applied", search: { n: first.trim(), src: "quiz" } });
    } catch {
      setErrors({ form: "Something went wrong. Call or text us instead, we answer fast." });
      setBusy(false);
    }
  }

  const Options = ({ items, value, onPick }: { items: readonly (readonly [string, string])[]; value: string; onPick: (v: string) => void }) => (
    <div className="bl-options" role="group">
      {items.map(([label, hint]) => (
        <button key={label} type="button" className="bl-option" aria-pressed={value === label} onClick={() => onPick(label)}>
          <span>{label}{hint ? <small>{hint}</small> : null}</span>
          <IconArrow />
        </button>
      ))}
    </div>
  );

  return (
    <>
      <Header cta={false} />
      <main className="bl-quiz bl-page-end">
        <div className="bl-wrap bl-quiz__card">
          <div className="bl-progress" aria-hidden="true"><span style={{ width: `${Math.round((step / TOTAL) * 100)}%` }} /></div>
          <p className="bl-quiz__step">Step {step} of {TOTAL}</p>

          {step === 1 ? (
            <>
              <h1>What are you looking for?</h1>
              <p className="bl-quiz__hint">Pick the closest. Your recruiter can change it on the call.</p>
              <Options items={LANES} value={lane} onPick={pick(setLane)} />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <h1>How much CDL-A experience do you have?</h1>
              <p className="bl-quiz__hint">Verifiable time behind the wheel with a Class A.</p>
              <Options items={EXPERIENCE_OPTIONS.map((o) => [o, o === "Under 3 months" ? "Apply anyway, we will tell you what is open" : ""] as const)} value={exp} onPick={pick(setExp)} />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <h1>How much home time do you need?</h1>
              <p className="bl-quiz__hint">This is set before any carrier sees you.</p>
              <Options items={HOME} value={home} onPick={pick(setHome)} />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <h1>What matters most in your next job?</h1>
              <p className="bl-quiz__hint">One answer. It decides who we call first.</p>
              <Options items={MATTERS} value={matters} onPick={pick(setMatters)} />
            </>
          ) : null}
          {step === 5 ? (
            <>
              <h1>Where are you based?</h1>
              <p className="bl-quiz__hint">So we match you to carriers that hire in your area.</p>
              <div className="bl-row2">
                <label className="bl-field">
                  <span>State</span>
                  <select className="bl-select" value={state} onChange={(e) => setState(e.target.value)} autoComplete="address-level1">
                    <option value="">Choose</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="bl-field">
                  <span>City</span>
                  <input className="bl-input" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="Orlando" />
                </label>
              </div>
              <button type="button" className="bl-cta-submit" onClick={() => setStep(6)}>Last step</button>
            </>
          ) : null}
          {step === 6 ? (
            <form onSubmit={onSubmit} noValidate>
              <h1>Where should your recruiter call?</h1>
              <p className="bl-quiz__hint">You will get a call from a (407) number within 5 minutes during working hours.</p>
              <div className="bl-row2">
                <label className="bl-field">
                  <span>First name</span>
                  <input className="bl-input" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} aria-invalid={!!errors.first} />
                  {errors.first ? <p className="bl-err">{errors.first}</p> : null}
                </label>
                <label className="bl-field">
                  <span>Last name</span>
                  <input className="bl-input" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} />
                </label>
              </div>
              <label className="bl-field">
                <span>Mobile number</span>
                <input className="bl-input" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} placeholder="(555) 555-5555" />
                {errors.phone ? <p className="bl-err">{errors.phone}</p> : null}
              </label>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, opacity: 0, height: 0 }} />
              <label className="bl-consent">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>{CONSENT_TEXT}</span>
              </label>
              {errors.consent ? <p className="bl-err" style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>{errors.consent}</p> : null}
              {errors.form ? <p className="bl-err" style={{ marginBottom: "0.75rem" }}>{errors.form}</p> : null}
              <button className="bl-cta-submit" type="submit" disabled={busy}>{busy ? "Sending" : "Get my callback"}</button>
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
        <Footer />
      </main>
      <StickyBar />
    </>
  );
}
