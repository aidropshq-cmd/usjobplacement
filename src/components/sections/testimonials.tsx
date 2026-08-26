import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";

/**
 * Candidate testimonials.
 *
 * Ships with an empty array on purpose. There are no real testimonials yet,
 * and an invented one on a service that handles people's immigration status
 * and money would poison every other trust signal on the page.
 *
 * The component renders nothing while the array is empty, so the section
 * simply does not exist until there is something true to put in it. Add
 * entries here — with `consentGiven: true` — and it appears.
 */
export type Testimonial = {
  quote: string;
  /** Role at the time, not the employer. Naming employers needs its own consent. */
  role: string;
  yearsExperience: number;
  serviceUsed: string;
  outcome: string;
  /** Written permission to publish. Never set this true on someone's behalf. */
  consentGiven: boolean;
};

export const testimonials: Testimonial[] = [];

export function Testimonials() {
  const publishable = testimonials.filter((item) => item.consentGiven);
  if (publishable.length === 0) return null;

  return (
    <Section divided>
      <SectionHeading
        eyebrow="In their words"
        title="What candidates say"
        lede="Published with permission. Roles and outcomes are as the candidate described them."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {publishable.map((item) => (
          <figure
            key={item.quote}
            className="flex card-interactive flex-col rounded-lg border border-hairline bg-card p-6 shadow-raised"
          >
            <blockquote className="flex-1 text-muted-foreground">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-5 border-t border-hairline pt-4 text-sm">
              <span className="block font-medium text-ink">{item.role}</span>
              <span className="mt-1 block text-caption">
                {item.yearsExperience} years&rsquo; experience ·{" "}
                {item.serviceUsed}
              </span>
              <span className="mt-1 block text-caption">{item.outcome}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
