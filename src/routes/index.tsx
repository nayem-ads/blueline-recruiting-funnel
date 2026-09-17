import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { ScrollScrub } from "@/components/scroll-scrub/scroll-scrub";
import { Footer, Header, IconArrow, IconCheck, IconPhone, IconText, PHONE_DISPLAY, PHONE_TEL, SMS_HREF, StickyBar } from "@/components/site/chrome";
import { QuickForm } from "@/components/site/quick-form";
import { bindContactClicks } from "@/lib/tracking";
import { scrollScrubScenes, scrollScrubTheme } from "@/scroll-scrub-scenes";

export const Route = createFileRoute("/")({
  component: Index,
});

const heroActions = (
  <>
    <Link to="/apply" className="bl-cta-primary">
      See if I qualify <IconArrow />
    </Link>
    <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call">
      <IconPhone /> Call {PHONE_DISPLAY}
    </a>
  </>
);
const recruiterActions = (
  <>
    <Link to="/apply" className="bl-cta-primary">
      See if I qualify <IconArrow />
    </Link>
    <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call">
      <IconPhone /> Call {PHONE_DISPLAY}
    </a>
  </>
);
// Module constant: the engine rebuilds its controller if this identity changes.
const scenes = scrollScrubScenes.map((s, i) =>
  i === 0 ? { ...s, actions: heroActions } : i === 2 ? { ...s, actions: recruiterActions } : s,
);

const FAQ = [
  ["Is it really free?", "Yes. Carriers pay BlueLine a placement fee when you start. You never pay anything, and nothing comes out of your pay."],
  ["How fast will someone actually call?", "Within 5 minutes during working hours, from a (816) number. Apply overnight and you hear from us first thing in the morning. If you can't talk, text us and we work around your schedule."],
  ["What experience do I need?", "A Class A CDL and at least 2 years of verifiable OTR experience, with a clean enough record to pass our carriers' review (see the requirements above). Under 2 years? Call us and we tell you exactly when you will qualify."],
  ["What is the pay, really?", "Solo company drivers earn 71 cents a mile. Teams earn 85 to 90 cents a mile for the truck. Lease programs pay differently. You hear the exact number for what you qualify for on the call, not a range on a website."],
  ["Who sees my number?", "Only your BlueLine recruiter. We do not sell or share leads, so you will not get calls from companies you never picked."],
  ["What about home time?", "It is the first thing we ask, before pay. Carriers that cannot meet your home time never see your application."],
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EmploymentAgency",
  name: "BlueLine Recruiting",
  url: "https://www.linerecruiting.com/",
  telephone: "+1-816-256-8329",
  areaServed: "US",
  description: "Free CDL-A driver recruiting for drivers with 2+ years OTR experience. Apply once, a real recruiter calls in 5 minutes.",
};

function Index() {
  useEffect(() => bindContactClicks(), []);
  return (
    <>
      <Header />
      <main className="bl-page-end">
        <ScrollScrub scenes={scenes} theme={scrollScrubTheme} />

        <section className="bl-section bl-section--flush" id="apply">
          <div className="bl-wrap bl-form-split">
            <div className="bl-form-side">
              <h2 className="bl-h2">Tell us what you want. We do the rest.</h2>
              <p className="bl-lead">Three fields, then a real recruiter calls you. Bring your Class A and 2 years of OTR experience, we bring the truck.</p>
              <ul className="bl-checks">
                <li><IconCheck /> <strong className="bl-hl">71¢</strong> a mile solo, <strong className="bl-hl">85 to 90¢</strong> a mile for teams, paid weekly</li>
                <li><IconCheck /> Well-maintained trucks, consistent miles</li>
                <li><IconCheck /> Home time set before you ever talk to a carrier</li>
                <li><IconCheck /> Free for drivers. Carriers pay us, not you</li>
              </ul>
            </div>
            <QuickForm />
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-wrap">
            <h2 className="bl-h2">Pick the lane you want</h2>
            <p className="bl-lead">Pick one and we start the application with that in mind. Not sure? Pick the closest and your recruiter sorts it out on the call.</p>
            <div className="bl-lanes">
              <Link to="/apply" search={{ lane: "Company OTR" }} className="bl-lane">
                <h3>Company OTR</h3>
                <p>Solo OTR on well-maintained equipment.</p>
                <ul>
                  <li><strong className="bl-hl">71¢</strong> a mile solo</li>
                  <li>Well-maintained truck</li>
                  <li>Paid weekly</li>
                  <li><strong className="bl-hl">2+ years</strong> OTR experience</li>
                </ul>
                <span className="bl-lane__go">Start here <IconArrow /></span>
              </Link>
              <Link to="/apply" search={{ lane: "Team" }} className="bl-lane">
                <h3>Team</h3>
                <p>Run with a partner, keep the truck moving.</p>
                <ul>
                  <li><strong className="bl-hl">85 to 90¢</strong> a mile for the team</li>
                  <li>Consistent freight, higher weekly totals</li>
                  <li>Bring your co-driver or get matched</li>
                </ul>
                <span className="bl-lane__go">Start here <IconArrow /></span>
              </Link>
              <Link to="/apply" search={{ lane: "Lease purchase" }} className="bl-lane">
                <h3>Lease purchase</h3>
                <p>For drivers who want more control.</p>
                <ul>
                  <li>Bigger upside on good miles</li>
                  <li>Pick your lanes</li>
                  <li>Best fit for 2+ years experience</li>
                </ul>
                <span className="bl-lane__go">Start here <IconArrow /></span>
              </Link>
            </div>
          </div>
        </section>

        <section className="bl-section" id="requirements">
          <div className="bl-wrap">
            <h2 className="bl-h2">What our carriers require</h2>
            <p className="bl-lead">Check these before you apply. If you meet them, you will be talking to a recruiter within 5 minutes.</p>
            <div className="bl-req">
              <div>
                <h3>Experience and license</h3>
                <ul>
                  <li>Class A CDL, 23 years or older</li>
                  <li>At least 2 years of verifiable OTR experience</li>
                  <li>Able to pass a DOT physical and drug test</li>
                </ul>
              </div>
              <div>
                <h3>Driving record</h3>
                <ul>
                  <li>No more than 1 CMV on-road preventable accident in the last 2 years</li>
                  <li>No major CMV preventable accidents in the last 5 years</li>
                  <li>No more than 2 moving violations in the last 2 years</li>
                  <li>No DUI/DWI in the past 5 years, or 10 years if it happened while holding a CDL</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-wrap">
            <h2 className="bl-h2">You have heard it all before. Here is the difference.</h2>
            <div className="bl-obj">
              <div className="bl-obj__row">
                <p className="bl-obj__q">"I applied everywhere and nobody called."</p>
                <p className="bl-obj__a"><strong>A person calls in 5 minutes.</strong> Miss it and we text you. Nobody gets ghosted.</p>
              </div>
              <div className="bl-obj__row">
                <p className="bl-obj__q">"Recruiters lie about the pay."</p>
                <p className="bl-obj__a"><strong>You hear the number on the call and it matches the offer letter.</strong> If it does not, do not sign. We only get paid when you start and stay.</p>
              </div>
              <div className="bl-obj__row">
                <p className="bl-obj__q">"Nobody cares about my home time."</p>
                <p className="bl-obj__a"><strong>It is the first question we ask.</strong> Carriers that cannot meet it never see your application.</p>
              </div>
              <div className="bl-obj__row">
                <p className="bl-obj__q">"I am not filling out ten forms."</p>
                <p className="bl-obj__a"><strong>One application, three fields to start.</strong> We handle the paperwork with the carrier.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-wrap">
            <p className="bl-eyebrow">How it works</p>
            <h2 className="bl-h2">From this page to the driver seat</h2>
            <div className="bl-steps">
              <div className="bl-step">
                <h3>Tell us what you want</h3>
                <p>60 seconds. Pay, home time, the lane you want. That is the whole application.</p>
              </div>
              <div className="bl-step">
                <h3>Your recruiter calls</h3>
                <p>5 minutes later, from a (816) number. They confirm your experience and tell you exactly what you qualify for.</p>
              </div>
              <div className="bl-step">
                <h3>Pick your truck and go</h3>
                <p>Offer in writing, orientation date booked, and you are on the road. We stay on the phone through your first weeks.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bl-section bl-band">
          <div className="bl-wrap bl-band__row">
            <div>
              <h2>Rather text than type?</h2>
              <p>Send your name and "looking for a job" to {PHONE_DISPLAY}. A recruiter takes it from there. No form needed.</p>
            </div>
            <a href={SMS_HREF} className="bl-band__btn" data-track="click_text"><IconText /> Text us now</a>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-wrap">
            <h2 className="bl-h2">Straight answers</h2>
            <div className="bl-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bl-section">
          <div className="bl-wrap bl-final">
            <p className="bl-eyebrow">Free for drivers</p>
            <h2 className="bl-h2">Ready when you are. So is the truck.</h2>
            <p className="bl-lead">Apply once. A real recruiter calls in 5 minutes. If we cannot beat what you have, we tell you.</p>
            <div className="bl-final__row">
              <Link to="/apply" className="bl-cta-primary">See if I qualify <IconArrow /></Link>
              <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call"><IconPhone /> Call {PHONE_DISPLAY}</a>
            </div>
          </div>
        </section>

        <Footer />
      </main>
      <StickyBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, faqJsonLd]) }} />
    </>
  );
}
