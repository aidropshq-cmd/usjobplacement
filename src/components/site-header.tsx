import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { navLinks, siteConfig, whatsappChannelUrl } from "@/lib/site";

/** Sticky header carrying exactly one primary CTA. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-6 px-6 sm:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="text-base font-extrabold tracking-[-0.03em] text-ink">
            ZapKitt
          </span>
          <span className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
            Placement
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
          {navLinks
            .filter((l) => l.live)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {/* Icon-only on desktop: the header already overflowed at 768 once,
              so this adds width sparingly. The accessible name carries the
              meaning for anyone not reading the glyph. */}
          {whatsappChannelUrl ? (
            <a
              href={whatsappChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp channel — US role updates and interview prep"
              className="hidden size-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 lg:inline-flex"
            >
              <WhatsAppIcon className="size-[18px]" />
              <span className="sr-only">
                WhatsApp channel — opens in a new tab
              </span>
            </a>
          ) : null}
          <Button
            asChild
            variant="ghost"
            className="hidden min-h-11 lg:inline-flex"
          >
            <Link href={siteConfig.secondaryCta.href}>
              {siteConfig.secondaryCta.label}
            </Link>
          </Button>
          <Button asChild className="hidden min-h-11 sm:inline-flex">
            <Link href={siteConfig.cta.href}>{siteConfig.cta.label}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-11 lg:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks
                  .filter((l) => l.live)
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex min-h-11 items-center rounded-sm px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
              </nav>
              {whatsappChannelUrl ? (
                <a
                  href={whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-4 flex min-h-11 items-center gap-2.5 rounded-sm px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                >
                  <WhatsAppIcon className="size-4 shrink-0" />
                  <span>
                    WhatsApp channel
                    <span className="block text-xs text-caption">
                      US role updates &amp; interview prep
                    </span>
                  </span>
                </a>
              ) : null}
              <div className="mt-4 px-4">
                <Button asChild size="cta" className="w-full">
                  <Link href={siteConfig.cta.href}>{siteConfig.cta.label}</Link>
                </Button>
                <Button
                  asChild
                  size="cta"
                  variant="outline"
                  className="mt-2 w-full"
                >
                  <Link href={siteConfig.secondaryCta.href}>
                    {siteConfig.secondaryCta.label}
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
