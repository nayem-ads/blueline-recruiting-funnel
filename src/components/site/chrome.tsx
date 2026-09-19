import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const PHONE_DISPLAY = "(816) 256-8329";
export const PHONE_TEL = "tel:+18162568329";
export const SMS_HREF =
  "sms:+18162568329?&body=" +
  encodeURIComponent("Hey BlueLine, I'm looking for a CDL job. My name is ");
// consent default state pending compliance review
export const CONSENT_TEXT =
  "I agree to receive calls and texts from BlueLine Recruiting at the number provided, including by automated means, about CDL job opportunities. Consent is not a condition of any purchase. Msg and data rates may apply. Reply STOP to opt out. I confirm I'm 23 or older with 2+ years of verifiable OTR experience.";

export function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
export function IconText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
export function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Logo({ large = false }: { large?: boolean }) {
  return (
    <Link to="/" className={large ? "bl-logo bl-logo--lg" : "bl-logo"} aria-label="BlueLine Recruiting home">
      <span className="bl-logo__word">BLUELINE</span>
      <span className="bl-logo__line" aria-hidden="true" />
      <span className="bl-logo__sub">RECRUITING</span>
    </Link>
  );
}

export function Header({ cta = true }: { cta?: boolean }) {
  return (
    <header className="bl-header">
      <div className="bl-wrap bl-header__row">
        <Logo />
        <div className="bl-header__right">
          <a className="bl-header__phone" href={PHONE_TEL} data-track="click_call">
            <IconPhone />
            <span>{PHONE_DISPLAY}</span>
          </a>
          {cta ? (
            <a href="#apply" className="bl-cta-primary" style={{ minHeight: 44, padding: "0 1.1rem", fontSize: "0.98rem" }}>
              Get Offer
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function StickyBar() {
  return (
    <nav className="bl-sticky" aria-label="Quick actions">
      <a href={PHONE_TEL} data-track="click_call"><IconPhone />Call ({PHONE_DISPLAY.slice(1, 4)})</a>
      <a href="#apply" className="is-primary">Get Offer<IconArrow /></a>
    </nav>
  );
}

export function Footer({ children }: { children?: ReactNode }) {
  return (
    <footer className="bl-footer">
      <div className="bl-wrap">
        <div className="bl-footer__grid">
          <div>
            <Logo large />
            <p style={{ maxWidth: "48ch", marginTop: "1rem" }}>
              BlueLine Recruiting matches CDL-A drivers with vetted carriers based on pay, home time and the lanes you want. Free for drivers. Carriers pay us.
            </p>
          </div>
          <div>
            <p><a href={PHONE_TEL}>Call or text {PHONE_DISPLAY}</a></p>
            <p>Recruiters answer 7 days a week. If we miss you, we call back.</p>
            {children}
          </div>
        </div>
        <div className="bl-footer__legal">
          <span>© 2026 BlueLine Recruiting Inc. We never sell your personal information.</span>
          <span>
            <a href="https://www.linerecruiting.com/privacy" rel="noreferrer">Privacy</a>
            {" · "}
            <a href="https://www.linerecruiting.com/terms" rel="noreferrer">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
