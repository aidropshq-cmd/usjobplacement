import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PlacementRail } from "@/components/placement-rail";
import { AuthorizationSwitcher } from "@/components/sections/authorization-switcher";
import { ApplicationTracker } from "@/components/sections/application-tracker";
import { DashboardPreview } from "@/components/sections/dashboard-preview";
import { EngagementTiers } from "@/components/sections/engagement-tiers";
import { Faq } from "@/components/sections/faq";
import { InterviewSupport } from "@/components/sections/interview-support";
import { NeverPay } from "@/components/sections/never-pay";
import { Testimonials } from "@/components/sections/testimonials";
import { TrustStrip } from "@/components/sections/trust-strip";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

/** Resume → Job Matching → Applications → Interview → Offer. */
const FLOW = [
  "Resume",
  "Job matching",
  "Applications",
  "Interviews",
  "Offer",
] as const;

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ---------- 2. Hero ---------- */}
      <div className="border-b border-hairline bg-gradient-to-b from-tint/50 to-background">
        <Container className="pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="flex flex-col gap-5">
              <Eyebrow>End-to-end US IT job search support</Eyebrow>
              <h1 className="max-w-[18ch] text-display">
                Your US IT Job Search. Managed End-to-End.
              </h1>
              <p className="max-w-[56ch] text-lg text-muted-foreground">
                Resume optimization, targeted job matching, application support,
                interview preparation, offer review and onboarding — all in one
                place.
              </p>

              {/* One primary, one secondary. WhatsApp lives in the nav and
                  footer only — three buttons at equal weight is zero
                  primaries, and the readiness score is the differentiator. */}
              <div className="mt-2 flex w-full max-w-md flex-col gap-3">
                <Button size="cta" asChild className="w-full">
                  <Link href={siteConfig.cta.href}>
                    {siteConfig.cta.label}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="cta"
                  variant="outline"
                  asChild
                  className="w-full border-primary text-primary hover:bg-tint hover:text-violet-ink"
                >
                  <Link href={siteConfig.secondaryCta.href}>
                    {siteConfig.secondaryCta.label}
                  </Link>
                </Button>
              </div>

              <p className="text-sm text-caption">
                No salary commission • No hidden fees • No job guarantee
              </p>

              {/* The workflow, stated compactly under the CTAs. */}
              <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-hairline pt-6">
                {FLOW.map((label, i) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="rounded-sm bg-card px-2.5 py-1.5 text-xs font-medium text-ink shadow-xs">
                      {label}
                    </span>
                    {i < FLOW.length - 1 ? (
                      <span className="text-caption" aria-hidden>
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>

            <div className="lg:pt-2">
              <DashboardPreview compact />
            </div>
          </div>
        </Container>
      </div>

      {/* ---------- 3. Trust strip ---------- */}
      <Section tone="alt">
        <TrustStrip />
      </Section>

      {/* ---------- 4. Free readiness CTA ---------- */}
      <Section divided>
        <div className="rounded-lg border border-primary/25 bg-tint p-7 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-[22ch] text-h2">
                Start with a score, not a sales call.
              </h2>
              <p className="mt-3 max-w-[58ch] text-muted-foreground">
                Five questions, about two minutes. You get a readiness score
                across four dimensions and the three things worth fixing first.
                No charge, and nobody rings you unless you ask.
              </p>
            </div>
            <Button size="cta" asChild className="shrink-0">
              <Link href={siteConfig.cta.href}>
                {siteConfig.cta.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* ---------- 5. How it works ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="How it works"
          title="Your status changes the plan"
          lede="An F-1 student two years out and someone on OPT with the clock already running need different searches. Pick your status and the plan below changes with it."
        />
        <div className="mt-8">
          <AuthorizationSwitcher />
        </div>
      </Section>

      {/* ---------- 6. Eight-stage process ---------- */}
      <Section tone="alt" divided>
        <SectionHeading
          eyebrow="The process"
          title="Eight stages, and what you hold at the end of each"
          lede="Click any stage. Every one ends with something concrete — a document, a list, a log, a debrief. If a stage cannot produce one, it does not belong in the process."
        />
        <PlacementRail className="mt-10" />
      </Section>

      {/* ---------- 7. Dashboard preview ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="One place"
          title="Your job search, in one place"
          lede="Readiness, applications and matched roles in a single view, so you always know what state your search is in."
        />
        <div className="mt-8 max-w-2xl">
          <DashboardPreview />
        </div>
      </Section>

      {/* ---------- 9. Application tracker ---------- */}
      <Section tone="alt" divided>
        <SectionHeading
          eyebrow="Application tracking"
          title="Every application, logged and auditable"
          lede="Most job support goes quiet after the applications go out. Each one here carries a date, a status and a next action, so you can see exactly where your search stands instead of wondering whether anything is happening."
        />
        <div className="mt-8">
          <ApplicationTracker />
        </div>
      </Section>

      {/* ---------- 10-11. Resume + interview support ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="Interview support"
          title="Interview preparation that uses your resume"
          lede="Generic question banks do not prepare anyone. The questions come from your own experience, the rounds you are actually facing, and the stack in the job description."
        />
        <div className="mt-8">
          <InterviewSupport />
        </div>
      </Section>

      {/* ---------- 12. Proof ---------- */}
      <Testimonials />

      {/* ---------- 12b. Trust ---------- */}
      <Section tone="alt" divided>
        <SectionHeading
          eyebrow="Pricing, plainly"
          title="What you never pay"
          lede="The charge that makes people distrust this industry is a cut of your salary, month after month, long after the work is done. It does not exist here."
        />
        <div className="mt-10">
          <NeverPay />
        </div>
      </Section>

      {/* ---------- 13. Engagement tiers ---------- */}
      <Section divided id="pricing">
        <SectionHeading
          eyebrow="Engagement"
          title="Built for serious US IT job seekers"
          lede="Start free. Move up only if the work is worth it to you — the amount is quoted before anything begins, and nothing is tied to whether you accept an offer."
        />
        <div className="mt-10">
          <EngagementTiers />
        </div>
      </Section>

      {/* ---------- 14. FAQ ---------- */}
      <Section tone="alt" divided id="faq">
        <SectionHeading
          eyebrow="Questions"
          title="The things people ask before they trust us"
        />
        <div className="mt-8">
          <Faq />
        </div>
      </Section>

      {/* ---------- 15. Final CTA ---------- */}
      <Section tone="tint" divided>
        <div className="flex flex-col items-start gap-6">
          <h2 className="max-w-[24ch] text-h2">
            Ready to take control of your US IT job search?
          </h2>
          <p className="max-w-[56ch] text-muted-foreground">
            Start with the free readiness check. If you would rather talk it
            through with a person first, the career review is free too.
          </p>
          <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button size="cta" asChild className="w-full sm:w-auto">
              <Link href={siteConfig.cta.href}>
                {siteConfig.cta.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button
              size="cta"
              variant="outline"
              asChild
              className="w-full border-primary text-primary hover:bg-tint hover:text-violet-ink sm:w-auto"
            >
              <Link href={siteConfig.secondaryCta.href}>
                {siteConfig.secondaryCta.label}
              </Link>
            </Button>
          </div>
          <p className="text-sm text-caption">
            We coach you before every interview round and debrief with you
            after. We prepare you — we are never on the call.
          </p>
        </div>
      </Section>
    </main>
  );
}
