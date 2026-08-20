import type { Metadata } from "next";
import { Mail } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Button } from "@/components/ui/button";
import { siteConfig, stages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a free demo call",
  description:
    "A free walkthrough of the eight-stage placement process against your actual profile. No charge and no obligation.",
};

/**
 * Phase 03 replaces the mailto with the Calendly inline embed and a short
 * qualifying form posting to the Django API. Until that exists this page is
 * deliberately a working mailto rather than a dead "coming soon" — the site's
 * only primary CTA has to actually go somewhere.
 */
export default function BookDemoPage() {
  return (
    <main className="flex-1">
      <Container className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="flex flex-col gap-5">
            <Eyebrow>Free · no obligation</Eyebrow>
            <h1 className="max-w-[16ch] text-display">Book a free demo call</h1>
            <p className="max-w-[56ch] text-lg text-muted-foreground">
              Thirty minutes. We walk through the eight stages against your
              actual profile, tell you honestly whether it is ready, and quote
              the engagement before you commit to anything.
            </p>

            <div className="mt-2">
              <Button size="cta" asChild>
                <a
                  href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(
                    "Demo call — US job placement",
                  )}&body=${encodeURIComponent(
                    "Hi,\n\nI'd like to book a demo call.\n\nName:\nWork authorisation (F1 / OPT / STEM OPT / H-1B / GC / Citizen):\nTarget roles:\nLocation preference:\nWhen you're free to talk:\n\nThanks.",
                  )}`}
                >
                  <Mail aria-hidden />
                  Email us to schedule
                </a>
              </Button>
              <p className="mt-3 text-sm text-dim">
                Online scheduling is being set up. Until it is live, email
                reaches us directly and we reply with times.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
            <h2 className="text-h3 text-ink">What we cover on the call</h2>
            <ol className="mt-5 flex flex-col gap-3">
              {stages.map((stage, i) => (
                <li key={stage.id} className="flex gap-3 text-sm">
                  <span
                    className="font-mono text-xs text-primary"
                    data-numeric
                    aria-hidden
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-ink">{stage.title}</span>{" "}
                    — {stage.summary}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 border-t border-hairline pt-5 text-sm text-dim">
              We coach you before every interview round and debrief with you
              after. We prepare you — we are never on the call.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
