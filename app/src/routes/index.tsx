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
    <a href={SMS_HREF} className="bl-cta-call" data-track="click_text">
      <IconText /> Text us instead
    </a>
  </>
);
// Module constant: the engine rebuilds its controller if this identity changes.
const scenes = scrollScrubScenes.map((s, i) =>
  i === 0 ? { ...s, actions: heroActions } : i === 2 ? { ...s, actions: recruiterActions } : s,
);

const FAQ = [
  ["Is it really free?", "Yes. Carriers pay BlueLine a placement fee when you start. You never pay anything, and nothing comes out of your pay."],
  ["How fast will someone actually call?", "Within 5 minutes during working hours, from a (407) number. Apply overnight and you hear from us first thing in the morning. If you can't talk, text us and we work around your schedule."],
  ["What experience do I need?", "A Class A CDL and 3 months of verifiable experience for the brand-new-truck program. Under 3 months? Apply anyway and we tell you exactly what is open to you right now."],
  ["What is the pay, really?", "The solo company program we are running right now pays 71 cents a mile with a brand new truck, which works out to around $10K a month at normal miles. Team and lease programs pay differently. You hear the exact number for what you qualify for on the call, not a range on a website."],
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
  telephone: "+1-407-683-5894",
  areaServed: "US",
  description: "Free CDL-A driver recruiting. Apply once, a real recruiter calls in 5 minutes.",
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
              <p className="bl-lead">Three fields, then a real recruiter calls you. Bring your CDL and 3 months of experience, we bring the truck.</p>
              <ul className="bl-checks">
                <li><IconCheck /> Brand new truck, 71¢ a mile solo, paid weekly</li>
                <li><IconCheck /> Around $10K a month at normal miles</li>
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
                <p>The program we are running right now.</p>
                <ul>
                  <li>71¢ a mile solo</li>
                  <li>Brand new truck</li>
                  <li>Around $10K a month, paid weekly</li>
                  <li>3 months experience minimum</li>
                </ul>
                <span className="bl-lane__go">Start here <IconArrow /></span>
              </Link>
              <Link to="/apply" search={{ lane: "Team" }} className="bl-lane">
                <h3>Team</h3>
                <p>Run with a partner, keep the truck moving.</p>
                <ul>
                  <li>Higher weekly totals</li>
                  <li>Consistent freight</li>
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
                <p>5 minutes later, from a (407) number. They confirm your experience and tell you exactly what you qualify for.</p>
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
