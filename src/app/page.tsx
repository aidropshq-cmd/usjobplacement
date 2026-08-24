import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PlacementRail } from "@/components/placement-rail";
import { AuthorizationSwitcher } from "@/components/sections/authorization-switcher";
import { NeverPay } from "@/components/sections/never-pay";
import { TrustStrip } from "@/components/sections/trust-strip";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Button } from "@/components/ui/button";
import { siteConfig, stages, whatsappChannelUrl } from "@/lib/site";

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ---- 1. Hero + Placement Rail ---- */}
      <Container className="pt-16 pb-14 sm:pt-24 sm:pb-20">
        <div className="flex flex-col gap-5">
          <Eyebrow>US full-time roles</Eyebrow>
          <h1 className="max-w-[17ch] text-display">
            Placement, run as a process.
          </h1>
          <p className="max-w-[58ch] text-lg text-muted-foreground">
            Most job support is a stack of favours and a WhatsApp group. This is
            eight documented stages, from building your profile to your first
            ninety days — with no percentage of your salary at the end of it.
          </p>
          {/* Buttons stack full-width on a phone and sit on one row from sm up;
              the text link falls below either way. */}
          <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="cta" asChild className="w-full sm:w-auto">
              <Link href={siteConfig.cta.href}>
                {siteConfig.cta.label}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            {whatsappChannelUrl ? (
              <Button
                size="cta"
                variant="outline"
                asChild
                className="w-full border-primary text-primary hover:bg-tint hover:text-violet-ink sm:w-auto"
              >
                <a
                  href={whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon className="size-[18px]" />
                  Join WhatsApp channel
                </a>
              </Button>
            ) : null}
            <Link
              href="/process"
              className="rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              See all eight stages
            </Link>
          </div>
        </div>

        <PlacementRail className="mt-14" />
      </Container>

      {/* ---- 2. Trust strip ---- */}
      <Section tone="alt" divided>
        <TrustStrip />
      </Section>

      {/* ---- 3. Work-authorisation switcher ---- */}
      <Section divided>
        <SectionHeading
          eyebrow="Your status changes the plan"
          title="What your search looks like from where you're standing"
          lede="An F1 student two years out and someone on OPT with the clock already running need different searches. Pick your status and the plan below changes with it."
        />
        <div className="mt-8">
          <AuthorizationSwitcher />
        </div>
      </Section>

      {/* ---- 4. What you never pay ---- */}
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

      {/* ---- 5. What you get ---- */}
      <Section divided>
        <SectionHeading
          eyebrow="Deliverables"
          title="Eight stages, eight things you actually hold"
          lede="Every stage ends with something concrete — a document, a list, a log, a debrief. If a stage cannot produce one, it does not belong in the process."
        />
        <ol className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {stages.map((stage, i) => (
            <li
              key={stage.id}
              className="flex gap-4 border-t border-hairline pt-5"
            >
              <span
                className="font-mono text-sm text-primary"
                data-numeric
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-h3 text-ink">{stage.title}</span>
                <span className="mt-1.5 block text-sm text-muted-foreground">
                  {stage.deliverable}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---- final CTA ---- */}
      <Section tone="tint" divided>
        <div className="flex flex-col items-start gap-6">
          <h2 className="max-w-[20ch] text-h2">
            Start with a call. There is nothing to pay for it.
          </h2>
          <p className="max-w-[56ch] text-muted-foreground">
            We will walk you through the eight stages, tell you honestly whether
            your profile is ready, and quote the engagement before you commit to
            anything.
          </p>
          <Button size="cta" asChild>
            <Link href={siteConfig.cta.href}>
              {siteConfig.cta.label}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <p className="text-sm text-dim">
            We coach you before every interview round and debrief with you
            after. We prepare you — we are never on the call.
          </p>
        </div>
      </Section>
    </main>
  );
}
