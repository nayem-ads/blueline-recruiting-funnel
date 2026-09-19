import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { Footer, Header, IconCheck, IconPhone, IconText, PHONE_DISPLAY, PHONE_TEL, SMS_HREF } from "@/components/site/chrome";
import { bindContactClicks, trackLeadUnqualified } from "@/lib/tracking";

type Search = { reason?: "experience" | "schedule"; n?: string; src?: string };

export const Route = createFileRoute("/applied-notyet")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    reason: s.reason === "schedule" ? "schedule" : "experience",
    n: typeof s.n === "string" ? s.n.slice(0, 40) : undefined,
    src: typeof s.src === "string" ? s.src.slice(0, 20) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Thanks — We've Kept Your Details | BlueLine Recruiting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppliedNotYet,
});

function AppliedNotYet() {
  const { reason } = Route.useSearch();

  useEffect(() => {
    // Unqualified boundary: fires LeadUnqualified custom event. NEVER fires Lead on this page.
    trackLeadUnqualified(reason === "schedule" ? "schedule" : "experience");
    return bindContactClicks();
  }, [reason]);

  return (
    <>
      <Header cta={false} />
      <main className="bl-thanks">
        <div className="bl-wrap bl-thanks__card">
          <span className="bl-thanks__badge"><IconCheck /> Details received</span>
          <h1>THANKS — WE&#39;VE KEPT YOUR DETAILS.</h1>
          <p className="bl-lead" style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
            Our carriers require 2+ years of verifiable OTR experience and multi-week runs. If that changes, come back — we&#39;ll be here. Questions? Call or text {PHONE_DISPLAY}.
          </p>
          <div className="bl-final__row" style={{ marginTop: "1.5rem" }}>
            <a href={PHONE_TEL} className="bl-cta-call" data-track="click_call">
              <IconPhone /> Call {PHONE_DISPLAY}
            </a>
            <a href={SMS_HREF} className="bl-cta-primary" data-track="click_text">
              <IconText /> Text us
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
