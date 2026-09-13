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
    kicker: "CDL-A drivers with 2+ years OTR experience",
    title: "71¢ a mile solo. 85 to 90¢ teams. Home when you say.",
    body: "Tell us what you want out of your next job once. We put it in front of carriers that fit, and a real recruiter calls you back in 5 minutes.",
    tags: ["Well-maintained trucks", "Paid weekly", "100% free for drivers"],
    clip: "/assets/world/scene-01.mp4",
    poster: "/assets/world/scene-01-poster.jpg",
    mobileClip: "/assets/world/scene-01-mobile.mp4",
    mobilePoster: "/assets/world/scene-01-mobile-poster.jpg",
    objectPosition: "50% 55%",
    mobileObjectPosition: "50% 50%",
    scroll: 1.6,
    linger: 0.2,
  },
  {
    id: "apply-once",
    label: "Apply once",
    title: "Apply once. We do the applying.",
    body: "No ten forms on ten websites. Your pay, home time and lane preferences go to vetted carriers together, and you only talk to the ones that match.",
    tags: ["Vetted carriers only", "Your number is never resold"],
    clip: "/assets/world/scene-02.mp4",
    poster: "/assets/world/scene-02-poster.jpg",
    mobileClip: "/assets/world/scene-02-mobile.mp4",
    mobilePoster: "/assets/world/scene-02-mobile-poster.jpg",
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
    align: "right",
    scroll: 1.4,
    linger: 0.2,
  },
  {
    id: "recruiter",
    label: "5-minute callback",
    title: "A real recruiter calls in 5 minutes.",
    body: "One person who knows your name and your home-time ask. Not a robot, not a reseller, not forty calls from companies you never picked.",
    tags: ["Calls from a (407) number", "Text if you can't talk"],
    clip: "/assets/world/scene-03.mp4",
    poster: "/assets/world/scene-03-poster.jpg",
    mobileClip: "/assets/world/scene-03-mobile.mp4",
    mobilePoster: "/assets/world/scene-03-mobile-poster.jpg",
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 45%",
    scroll: 1.4,
    linger: 0.25,
  },
];
