import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { Footer, Header, IconCheck, IconPhone, IconText, PHONE_DISPLAY, PHONE_TEL, SMS_HREF } from "@/components/site/chrome";
import { bindContactClicks, trackLeadOnce } from "@/lib/tracking";

type Search = { n?: string; src?: string };

export const Route = createFileRoute("/applied")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    n: typeof s.n === "string" ? s.n.slice(0, 40) : undefined,
    src: typeof s.src === "string" ? s.src.slice(0, 20) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "You are in. Pick up the phone. | BlueLine Recruiting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Applied,
});

function Applied() {
  const { n, src } = Route.useSearch();
  useEffect(() => {
    // Conversion boundary: the pixel Lead event fires exactly once per submit
    trackLeadOnce({ source: src ?? "direct", page: "applied" });
    return bindContactClicks();
  }, [src]);
  const name = n ? `${n}, you` : "You";
  return (
    <>
      <Header cta={false} />
      <main className="bl-thanks">
        <div className="bl-wrap bl-thanks__card">
          <span className="bl-thanks__badge"><IconCheck /> Application received</span>
          <h1>{name} are in. Keep your phone close.</h1>
          <p className="bl-lead" style={{ fontSize: "1.2rem" }}>
            Your recruiter is calling in the next 5 minutes during working hours. The call comes from this number, so save it and pick up:
          </p>
          <a className="bl-thanks__phone" href={PHONE_TEL} data-track="click_call">{PHONE_DISPLAY}</a>
          <p className="bl-lead">Applied overnight? You hear from us first thing in the morning. Cannot talk right now? Text us a good time.</p>
          <div className="bl-final__row">
            <a href={SMS_HREF} className="bl-cta-primary" data-track="click_text"><IconText /> Text my recruiter</a>
            <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call"><IconPhone /> Call now</a>
          </div>
          <div className="bl-thanks__next">
            <h2>Have these ready for the call</h2>
            <ol>
              <li>Your CDL-A and the date it was issued</li>
              <li>Where you drove and for how long (company names are enough)</li>
              <li>The home time you need and the pay you will not go under</li>
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
