import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AuthorizationSwitcher } from "@/components/sections/authorization-switcher";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { Button } from "@/components/ui/button";
import { siteConfig, stages } from "@/lib/site";

export const metadata: Metadata = {
  title: "The process",
  description:
    "All eight stages of the placement process in full — profile building, resume and LinkedIn, targeted applications, interview prep, interview rounds, background verification, offer review and onboarding.",
};

export default function ProcessPage() {
  return (
    <main className="flex-1">
      <Container className="pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="flex flex-col gap-5">
          <Eyebrow>The process, in full</Eyebrow>
          <h1 className="max-w-[18ch] text-display">
            Eight stages, and what happens in each.
          </h1>
          <p className="max-w-[60ch] text-lg text-muted-foreground">
            The homepage rail is the short version. This is the whole thing —
            what we do at each stage, and what you are holding when it ends.
          </p>
        </div>
      </Container>

      {/* ---- the rail at full depth ---- */}
      <Section divided containerWidth="default" className="py-0 sm:py-0">
        <ol className="flex flex-col">
          {stages.map((stage, i) => (
            <li
              key={stage.id}
              className="relative grid gap-x-8 gap-y-4 border-b border-hairline py-10 last:border-b-0 md:grid-cols-[7rem_1fr_16rem]"
            >
              {/* stage index + connector */}
              <div className="relative flex items-center gap-4 md:block">
                <span
                  aria-hidden
                  className="absolute top-8 -bottom-10 left-[7px] hidden w-0.5 bg-border md:block"
                />
                <span
                  aria-hidden
                  className="relative z-10 block size-4 shrink-0 rounded-full border-2 border-primary bg-primary md:absolute md:top-1.5 md:left-0"
                />
                <span
                  className="font-mono text-sm text-primary md:mt-0 md:block md:pt-0.5 md:pl-7"
                  data-numeric
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div>
                <h2 className="text-h3 text-ink">{stage.title}</h2>
                <p className="mt-3 max-w-[60ch] text-muted-foreground">
                  {stage.detail}
                </p>
              </div>

              <div className="self-start rounded-sm bg-surface-alt p-4">
                <span className="font-mono text-xs tracking-[0.1em] text-dim uppercase">
                  You end up with
                </span>
                <p className="mt-2 text-sm font-medium text-ink">
                  {stage.deliverable}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---- authorisation switcher ---- */}
      <Section tone="alt" divided>
        <SectionHeading
          eyebrow="Your status changes the plan"
          title="How the process adapts to your work authorisation"
          lede="The eight stages stay the same. What changes is the timeline we plan against and which employers make the target list."
        />
        <div className="mt-8">
          <AuthorizationSwitcher />
        </div>
      </Section>

      {/* ---- what we will not do ---- */}
      <Section divided>
        <SectionHeading
          eyebrow="Boundaries"
          title="How we work, and what we won't do"
          lede="Everything below is a line we hold. It is worth reading, because in this market not everyone holds them."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "We are never on your interview call",
              body: "We run mock interviews with you beforehand and debrief with you after. Anyone offering to sit on a live interview is offering fraud — it voids offers, gets candidates blacklisted by employers and background-check vendors, and puts your status at risk.",
            },
            {
              title: "We work with your real record",
              body: "Background verification means assembling and verifying your genuine employment and education history so it clears without delays. We do not invent experience, and we will not work with a profile that asks us to.",
            },
            {
              title: "We do not give legal advice",
              body: "We plan job searches. We are not immigration attorneys, and nothing here is legal advice. Confirm your own dates and eligibility with your DSO or a licensed immigration attorney.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-hairline bg-card p-6"
            >
              <h3 className="text-h3 text-ink">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="tint" divided>
        <div className="flex flex-col items-start gap-6">
          <h2 className="max-w-[20ch] text-h2">
            Want to see where you&rsquo;d start?
          </h2>
          <p className="max-w-[56ch] text-muted-foreground">
            The demo call is a walkthrough of these eight stages against your
            actual profile, not a sales pitch. It is free.
          </p>
          <Button size="cta" asChild>
            <Link href={siteConfig.cta.href}>
              {siteConfig.cta.label}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>
    </main>
  );
}
