import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ContactLinks } from "@/components/contact-links";
import { footerColumns, siteConfig, type FooterLink } from "@/lib/site";

/** WhatsApp glyph. Inline so the footer carries no extra asset request. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
          <WhatsAppIcon className="mt-0.5 size-4 shrink-0" />
        ) : null}
        <span>
          {link.label}
          {link.subtitle ? (
            <span className="mt-0.5 block text-xs text-dim">
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
              <h2 className="font-mono text-xs font-medium tracking-[0.12em] text-dim uppercase">
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
          <p className="text-sm text-dim">
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
