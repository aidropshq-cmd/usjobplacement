import { Check } from "lucide-react";

import { siteConfig } from "@/lib/site";

/** The two canonical strings. Never write a third. */
const CTA = {
  readiness: siteConfig.cta.label,
  review: siteConfig.secondaryCta.label,
};

/**
 * Engagement tiers.
 *
 * No prices. The amount is quoted on the call and is still pending a legal
 * review of employment-agency licensing — see the README. Inventing a figure
 * here would be worse than saying nothing.
 */
const TIERS = [
  {
    name: "Free",
    summary: "Find out where you actually stand.",
    price: "No charge",
    items: [
      "Job search readiness assessment",
      "Score across four dimensions",
      "Your three highest-impact fixes",
      "Written action plan by email",
    ],
    // Free starts with the readiness check, so it carries the primary.
    cta: { label: CTA.readiness, href: "/assessment", primary: true },
    featured: false,
  },
  {
    name: "Assisted",
    summary: "You run the search. We make it work.",
    price: "Talk to us for your personalised plan",
    items: [
      "ATS-clean resume rewrite",
      "LinkedIn rewritten to match",
      "Job targeting and shortlist",
      "Application support",
      "Interview preparation",
    ],
    // Assisted and Full both begin with a conversation, so both carry the
    // secondary. The button says what the tier actually starts.
    cta: { label: CTA.review, href: "/book-demo", primary: false },
    featured: true,
  },
  {
    name: "Full support",
    summary: "All eight stages, start to finish.",
    price: "Talk to us for your personalised plan",
    items: [
      "Everything in Assisted",
      "End-to-end eight-stage support",
      "Application tracking you can audit",
      "Round-by-round interview coaching",
      "Offer review",
      "Onboarding and first 90 days",
    ],
    cta: { label: CTA.review, href: "/book-demo", primary: false },
    featured: false,
  },
];

export function EngagementTiers() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {TIERS.map((tier) => (
        <div
          key={tier.name}
          className={`flex flex-col rounded-lg border bg-card p-6 shadow-card ${
            tier.featured ? "border-primary" : "border-hairline"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-h3 text-ink">{tier.name}</h3>
            {/* "Recommended" is our opinion and needs no data behind it.
                "Most chosen" was a claim about other customers that nothing
                supports. Styled as a quiet label rather than a badge, so it
                reads as guidance and not as popularity. */}
            {tier.featured ? (
              <span className="rounded-sm border border-primary/30 px-2 py-1 font-mono text-[0.65rem] tracking-[0.1em] text-violet-ink uppercase">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{tier.summary}</p>
          <p className="mt-4 border-t border-hairline pt-4 text-sm font-medium text-ink">
            {tier.price}
          </p>
          <ul className="mt-5 flex flex-1 flex-col gap-2.5">
            {tier.items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
          <a
            href={tier.cta.href}
            className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-sm px-4 text-center text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
              tier.cta.primary
                ? "bg-primary text-primary-foreground hover:bg-violet-hover"
                : "border border-primary text-primary hover:bg-tint"
            }`}
          >
            {tier.cta.label}
          </a>
        </div>
      ))}
    </div>
  );
}
