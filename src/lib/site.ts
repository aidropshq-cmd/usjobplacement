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
    email: "aidropshq@gmail.com",
    /**
     * WhatsApp. Set `number` in full international E.164 form (digits only,
     * no +, no spaces) — that is what wa.me requires. Leave it empty and the
     * WhatsApp links simply do not render, so a half-configured number never
     * ships as a dead link.
     */
    whatsapp: {
      number: "",
      display: "",
    },
  },
  cta: {
    label: "Book a free demo call",
    href: "/book-demo",
  },
} as const;

/**
 * Navigation.
 *
 * `live: false` means the route is not built yet, so the link is not rendered.
 * Linking to a 404 is worse than not linking at all — and Next prefetches nav
 * links, so a dead entry also fires a 404 on every page load. Flip these to
 * true in phase 04 as each page ships; nothing else needs to change.
 */
export const navLinks = [
  { label: "Process", href: "/process", live: true },
  { label: "Pricing", href: "/pricing", live: false },
  { label: "Success stories", href: "/success-stories", live: false },
  { label: "FAQ", href: "/faq", live: false },
  { label: "Contact", href: "/contact", live: true },
] as const;

/**
 * A footer link.
 *
 * Explicitly typed rather than `as const` so the optional fields below are
 * usable: a readonly tuple of heterogeneous literals makes `link.subtitle`
 * an error on every entry that omits it.
 */
export type FooterLink = {
  label: string;
  href: string;
  /** False while the route is unbuilt — see the navLinks note above. */
  live: boolean;
  /** Opens in a new tab and renders as <a>, never next/link. */
  external?: boolean;
  /** One line under the label. Only where the label alone does not say
   *  what is on the other side. */
  subtitle?: string;
  icon?: "whatsapp";
};

/**
 * The channel URL comes from the environment so it can be changed without a
 * code edit. NEXT_PUBLIC_* is inlined at build time, so an unset variable in
 * Vercel means the link is absent from the bundle entirely — which is why
 * `live` is derived from it rather than hardcoded to true. No env var, no
 * dead link.
 */
const whatsappChannelUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ?? "";

export const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Service",
    links: [
      { label: "The process", href: "/process", live: true },
      { label: "What we do", href: "/services", live: false },
      { label: "Pricing", href: "/pricing", live: false },
      { label: "Success stories", href: "/success-stories", live: false },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", href: "/faq", live: false },
      { label: "Contact", href: "/contact", live: true },
      { label: "Book a free demo call", href: "/book-demo", live: true },
      {
        label: "WhatsApp channel",
        href: whatsappChannelUrl,
        live: Boolean(whatsappChannelUrl),
        external: true,
        subtitle: "US role updates & interview prep",
        icon: "whatsapp",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms", live: false },
      { label: "Privacy", href: "/privacy", live: false },
      { label: "Refunds", href: "/refund", live: false },
    ],
  },
];

/**
 * The eight stages of the placement process. Drives the Placement Rail, the
 * /process page, the "what you get" section, and portal progress.
 *
 * `deliverable` is the concrete artefact the candidate ends the stage holding.
 * Keep them concrete — "a target role list" beats "clarity on your search".
 */
export const stages = [
  {
    id: "profile",
    title: "Profile build",
    summary: "Positioning, target roles, gap review",
    deliverable: "Target role list and positioning brief",
    detail:
      "We map where you actually stand — your degree, your work history, your work authorisation timeline, and the roles that will realistically convert. You end this stage with a named list of role titles and company profiles to aim at, not a vague promise to apply everywhere.",
  },
  {
    id: "resume",
    title: "Resume & LinkedIn",
    summary: "ATS-clean rewrite, keyword mapping",
    deliverable: "ATS-clean resume and a rewritten LinkedIn profile",
    detail:
      "One resume, rewritten against the roles from stage 01 and formatted so applicant tracking systems parse it cleanly. Keywords come from the real job descriptions in your target set rather than a generic list. Your LinkedIn profile is rewritten to match, because recruiters read both.",
  },
  {
    id: "applications",
    title: "Targeted applications",
    summary: "Matched to the profile, not sprayed",
    deliverable: "An application log you can audit line by line",
    detail:
      "We apply to roles that match both your profile and your work authorisation. Every application is logged with the date, the role, the company and the outcome, so you can see exactly where your search stands instead of wondering whether anything is happening.",
  },
  {
    id: "prep",
    title: "Interview prep",
    summary: "Mock rounds, role-specific drilling",
    deliverable: "Mock interviews with written feedback after each one",
    detail:
      "Mock interviews for the specific rounds you are facing — recruiter screen, technical, system design, behavioural — with written feedback after each one. We coach you before the round and debrief with you after it. We are never on the call itself.",
  },
  {
    id: "rounds",
    title: "Interview rounds",
    summary: "Debriefs between every round",
    deliverable: "A debrief and an adjusted prep plan after every round",
    detail:
      "Between rounds we go through what was asked, what landed and what did not, then adjust the preparation for the next one. If a loop goes quiet, we follow up with the recruiter on your behalf so you are not left guessing.",
  },
  {
    id: "bgv",
    title: "Background verification",
    summary: "Document checklist and guidance",
    deliverable: "A background-check document checklist",
    detail:
      "A checklist of the employment, education and identity records a US background check will ask for, and help assembling and verifying your genuine records so nothing stalls at the offer stage. We work with your real history — that is the only kind that clears.",
  },
  {
    id: "offer",
    title: "Offer review",
    summary: "Compensation, start date, paperwork",
    deliverable: "A line-by-line walkthrough of your offer",
    detail:
      "We go through the offer with you — base, bonus, equity, start date, relocation and the paperwork attached to it — so you understand what you are signing before you sign it, and so you know which parts are actually negotiable.",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    summary: "First-90-days handover",
    deliverable: "A first-90-days handover",
    detail:
      "Support through the paperwork, the start date and the first ninety days: what your employer needs from you, what you should expect from them, and how to handle the checkpoints that come up early in a new role.",
  },
] as const;

export type Stage = (typeof stages)[number];
export type StageId = Stage["id"];

/**
 * Work-authorisation switcher content.
 *
 * These describe how WE plan a search, not what the law entitles you to.
 * Nothing here is legal advice and none of it invents a statistic — see the
 * ZapKitt accuracy stance on visa data. Every panel carries the disclaimer.
 */
export const workAuthorizations = [
  {
    id: "f1",
    label: "F1",
    full: "F1 student",
    headline: "Build the profile before the clock starts.",
    body: "You are still studying, so the work that matters now is CPT-eligible internships and a profile that converts into a full-time offer before you graduate. Starting here is the single biggest advantage a student can give themselves — the search is far harder once the degree is finished and the timeline is running.",
    focus: "Internships that convert, early positioning",
  },
  {
    id: "opt",
    label: "OPT",
    full: "Post-completion OPT",
    headline: "We work backwards from your EAD date.",
    body: "Post-completion OPT gives you a defined authorisation period, and the count of unemployed days runs against it. We plan the search backwards from your EAD start date rather than forwards from today, and we prioritise employers with a recent sponsorship filing history over ones that filed once, years ago.",
    focus: "Timeline-first planning, employers who actually file",
  },
  {
    id: "stem-opt",
    label: "STEM OPT",
    full: "STEM OPT extension",
    headline: "E-Verify narrows the list — usefully.",
    body: "If your degree qualifies for the STEM extension, the employer needs to be enrolled in E-Verify and a formal training plan is part of the process. That requirement narrows your target list, which sounds like a constraint and is actually a filter: it removes employers who were never going to work out.",
    focus: "E-Verify employers, training plan requirements",
  },
  {
    id: "h1b",
    label: "H-1B",
    full: "H-1B",
    headline: "Cap-subject and cap-exempt are different searches.",
    body: "Whether you are subject to the annual cap or already counted against it changes the entire strategy, including when you can start. For transfers we target employers with recent, repeated filings rather than a single historical one — volume and recency tell you something, and no published approval rate does.",
    focus: "Transfer-ready targeting, recent filing history",
  },
  {
    id: "gc",
    label: "Green card",
    full: "Green card holder",
    headline: "No sponsorship question at all.",
    body: "Without a sponsorship constraint the search is about positioning and speed rather than employer eligibility. That widens the target list considerably, which makes the profile work in stage 01 matter more, not less — the risk shifts from too few options to unfocused ones.",
    focus: "Positioning and speed over eligibility",
  },
  {
    id: "citizen",
    label: "US citizen",
    full: "US citizen",
    headline: "Every role in your target set is open.",
    body: "No work-authorisation constraint applies, including roles that require it explicitly, such as federal and cleared work. The whole process still runs the same way — the difference is that nothing gets filtered out before we start.",
    focus: "Full target set, including cleared roles",
  },
] as const;

export type WorkAuthorization = (typeof workAuthorizations)[number];

/** Shown under the work-authorisation switcher. Do not remove. */
export const immigrationDisclaimer =
  "This describes how we plan a job search, not what you are entitled to do. We are not immigration attorneys. Confirm your own dates and eligibility with your DSO or a licensed immigration attorney.";
