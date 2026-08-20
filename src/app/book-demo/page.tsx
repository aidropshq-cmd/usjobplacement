import type { Metadata } from "next";

import { LeadForm } from "@/components/lead-form";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { siteConfig, stages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a free demo call",
  description:
    "A free walkthrough of the eight-stage placement process against your actual profile. No charge and no obligation.",
};

export default function BookDemoPage() {
  return (
    <main className="flex-1">
      <Container className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <div className="flex flex-col gap-5">
              <Eyebrow>Free · no obligation</Eyebrow>
              <h1 className="max-w-[16ch] text-display">
                Book a free demo call
              </h1>
              <p className="max-w-[54ch] text-lg text-muted-foreground">
                Thirty minutes. We walk through the eight stages against your
                actual profile, tell you honestly whether it is ready, and quote
                the engagement before you commit to anything.
              </p>
            </div>

            <div className="mt-10">
              <LeadForm />
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-hairline bg-surface-alt p-6 sm:p-7">
              <h2 className="text-h3 text-ink">What we cover</h2>
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
                      <span className="font-medium text-ink">
                        {stage.title}
                      </span>{" "}
                      — {stage.summary}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t border-hairline pt-5 text-sm text-dim">
                We coach you before every interview round and debrief with you
                after. We prepare you — we are never on the call.
              </p>
              <p className="mt-4 text-sm text-dim">
                Prefer email?{" "}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-primary underline underline-offset-4"
                >
                  {siteConfig.contact.email}
                </a>
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
