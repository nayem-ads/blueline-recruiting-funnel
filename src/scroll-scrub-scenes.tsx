import type {
  ScrollScrubScene,
  ScrollScrubTheme,
} from "@/components/scroll-scrub/scroll-scrub";

/** Brand tokens for the journey layer (mirrors src/site.css). */
export const scrollScrubTheme: ScrollScrubTheme = {
  accent: "#1A6EF4",
  background: "#0A1324",
  ink: "#F3F6FB",
  muted: "#A9B6CC",
};

/** One continuous 15 s film, split at frame boundaries into three chapter clips. */
export const scrollScrubScenes: ScrollScrubScene[] = [
  {
    id: "truck",
    label: "The truck",
    title: (
      <>
        <span className="bl-hero-line bl-hero-line--1">OTR DRIVERS WITH 2+ YEARS:</span>
        <span className="bl-hero-line bl-hero-line--2">
          <span className="bl-hero-chunk">ONE APPLICATION.</span>{" "}
          <span className="bl-hero-chunk">VETTED CARRIERS.</span>
        </span>
        <span className="bl-hero-line bl-hero-line--3">
          <span className="bl-hero-chunk">A REAL RECRUITER</span>{" "}
          <span className="bl-hero-chunk">CALLS YOU BACK.</span>
        </span>
      </>
    ),
    body: "3 weeks out, 3–4 days home — or 4 weeks out, 4–5 days home. 71¢ a mile solo, 85–90¢ teams, paid weekly. Free for drivers. Your number is never sold.",
    tags: ["Well-maintained trucks", "Paid weekly", "100% free for drivers"],
    clip: "/assets/world/scene-01.mp4",
    poster: "/assets/world/scene-01-poster.jpg",
    mobileClip: "/assets/world/scene-01-mobile.mp4",
    mobilePoster: "/assets/world/scene-01-mobile-poster.jpg",
    objectPosition: "50% 55%",
    mobileObjectPosition: "50% 25%",
    scroll: 1.2,
    linger: 0.15,
  },
  {
    id: "apply-once",
    label: "Apply once",
    title: (
      <>
        APPLY ONCE.
        <br />
        WE DO THE APPLYING.
      </>
    ),
    body: "No ten forms on ten websites. Your pay, home time and lane preferences go to vetted carriers together, and you only talk to the ones that match.",
    tags: ["Vetted carriers only", "Your number is never resold"],
    clip: "/assets/world/scene-02.mp4",
    poster: "/assets/world/scene-02-poster.jpg",
    mobileClip: "/assets/world/scene-02-mobile.mp4",
    mobilePoster: "/assets/world/scene-02-mobile-poster.jpg",
    objectPosition: "50% 50%",
    mobileObjectPosition: "28% 45%",
    align: "right",
    scroll: 1.2,
    linger: 0.15,
  },
  {
    id: "recruiter",
    label: "5-minute callback",
    title: (
      <>
        A REAL RECRUITER CALLS
        <br />
        IN <span className="bl-hl">5 MINUTES</span>.
      </>
    ),
    body: "One person who knows your name and your home-time ask. Not a robot, not a reseller, not forty calls from companies you never picked.",
    tags: ["Calls from a (816) number", "Text if you can't talk"],
    clip: "/assets/world/scene-03.mp4",
    poster: "/assets/world/scene-03-poster.jpg",
    mobileClip: "/assets/world/scene-03-mobile.mp4",
    mobilePoster: "/assets/world/scene-03-mobile-poster.jpg",
    objectPosition: "50% 50%",
    mobileObjectPosition: "45% 45%",
    scroll: 1.2,
    linger: 0.2,
  },
];
