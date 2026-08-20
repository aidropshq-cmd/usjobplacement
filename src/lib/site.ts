/**
 * Single source of truth for site-level strings and the one primary CTA.
 *
 * One page, one action: `cta` is the ONLY primary button anywhere on the
 * marketing site. Everything else is secondary or a plain text link.
 */
export const siteConfig = {
  name: "ZapKitt US Job Placement",
  title: "End-to-end US job placement, without the salary commission",
  description:
    "Profile building, targeted applications, resume and LinkedIn rewrites, interview coaching, background verification guidance and offer support — one flat engagement, no percentage of your salary.",
  url: "https://usjobplacement.zapkitt.com",
  parent: {
    name: "ZapKitt",
    url: "https://zapkitt.com",
  },
  contact: {
    email: "hello@zapkitt.com",
  },
  cta: {
    label: "Book a free demo call",
    href: "/book-demo",
  },
} as const;

/** The eight stages of the placement process. Drives the Placement Rail,
 *  the /process page, the "what you get" section, and portal progress. */
export const stages = [
  {
    id: "profile",
    title: "Profile build",
    summary: "Positioning, target roles, gap review",
  },
  {
    id: "resume",
    title: "Resume & LinkedIn",
    summary: "ATS-clean rewrite, keyword mapping",
  },
  {
    id: "applications",
    title: "Targeted applications",
    summary: "Matched to the profile, not sprayed",
  },
  {
    id: "prep",
    title: "Interview prep",
    summary: "Mock rounds, role-specific drilling",
  },
  {
    id: "rounds",
    title: "Interview rounds",
    summary: "Debriefs between every round",
  },
  {
    id: "bgv",
    title: "Background verification",
    summary: "Document checklist and guidance",
  },
  {
    id: "offer",
    title: "Offer review",
    summary: "Compensation, start date, paperwork",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    summary: "First-90-days handover",
  },
] as const;

export type Stage = (typeof stages)[number];
export type StageId = Stage["id"];
