import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Button } from "@/components/ui/button";
import { siteConfig, stages } from "@/lib/site";

/**
 * Holding page for phases 00–01.
 *
 * The full homepage — hero, Placement Rail, trust strip, authorisation
 * switcher, "what you never pay" — is phase 02. This exists so the subdomain
 * serves something honest and on-brand from the first deploy rather than a
 * default Next.js splash.
 */
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Container className="flex flex-1 flex-col justify-center py-20 sm:py-28">
        <div className="flex flex-col gap-6">
          <Eyebrow>ZapKitt · US job placement</Eyebrow>

          <h1 className="max-w-[16ch] text-display">
            Placement, run as a process.
          </h1>

          <p className="max-w-[var(--container-measure)] text-lg text-muted-foreground">
            {siteConfig.description}
          </p>

          <ol className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {stages.map((stage, i) => (
              <li
                key={stage.id}
                className="flex items-baseline gap-3 border-t border-hairline pt-3"
              >
                <span
                  className="font-mono text-xs text-dim tabular-nums"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-ink">
                  {stage.title}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="cta" asChild>
              <a href={`mailto:${siteConfig.contact.email}`}>
                Talk to us about your search
              </a>
            </Button>
            <a
              href={siteConfig.parent.url}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {siteConfig.parent.name}
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          </div>

          <p className="mt-8 max-w-[var(--container-measure)] border-t border-hairline pt-6 text-sm text-dim">
            We coach you before every interview round and debrief with you
            after. We prepare you — we are never on the call.
          </p>
        </div>
      </Container>
    </main>
  );
}
