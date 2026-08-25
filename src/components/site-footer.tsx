import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ContactLinks } from "@/components/contact-links";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { footerColumns, siteConfig, type FooterLink } from "@/lib/site";

/** Shared by both branches so external and internal links stay identical. */
const footerLinkClass =
  "rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50";

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-start gap-2 ${footerLinkClass}`}
      >
        {link.icon === "whatsapp" ? (
          <WhatsAppIcon className="mt-0.5 shrink-0" />
        ) : null}
        <span>
          {link.label}
          {link.subtitle ? (
            <span className="mt-0.5 block text-xs text-caption">
              {link.subtitle}
            </span>
          ) : null}
        </span>
      </a>
    );
  }

  return (
    <Link href={link.href} className={footerLinkClass}>
      {link.label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface-alt">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold tracking-[-0.03em] text-ink">
                ZapKitt
              </span>
              <span className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
                Placement
              </span>
            </div>
            <p className="mt-3 max-w-[38ch] text-sm text-muted-foreground">
              End-to-end support for genuine US full-time roles — from profile
              building through to onboarding.
            </p>
            <ContactLinks className="mt-4 flex-col items-start" size="sm" />
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-caption uppercase">
                {col.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links
                  .filter((l) => l.live)
                  .map((link) => (
                    <li key={link.href}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-caption">
            © {new Date().getFullYear()} ZapKitt. All rights reserved.
          </p>
          <a
            href={siteConfig.parent.url}
            className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Part of {siteConfig.parent.name}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  );
}
