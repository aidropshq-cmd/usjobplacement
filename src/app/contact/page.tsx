import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { ContactLinks } from "@/components/contact-links";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Questions about the placement process, pricing or your work authorisation — send us a message and we reply within one business day.",
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      <Container className="py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-5">
            <Eyebrow>Contact</Eyebrow>
            <h1 className="max-w-[14ch] text-display">Ask us anything</h1>
            <p className="max-w-[52ch] text-lg text-muted-foreground">
              Questions about the process, the pricing model, or how your work
              authorisation changes the plan. We read everything and reply
              within one business day.
            </p>
            <div className="mt-2 flex flex-col gap-1 border-t border-hairline pt-6">
              <span className="font-mono text-xs tracking-[0.1em] text-dim uppercase">
                Reach us directly
              </span>
              <ContactLinks className="mt-1 flex-col items-start" />
            </div>
            <p className="max-w-[52ch] text-sm text-dim">
              If you want to get started rather than ask a question, the demo
              call is the faster route — it is free and there is nothing to pay
              on it.
            </p>
          </div>

          <ContactForm />
        </div>
      </Container>
    </main>
  );
}
