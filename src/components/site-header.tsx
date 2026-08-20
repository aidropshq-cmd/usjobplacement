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
import { navLinks, siteConfig } from "@/lib/site";

/** Sticky header carrying exactly one primary CTA. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-6 px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-baseline gap-2 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="text-base font-extrabold tracking-[-0.03em] text-ink">
            ZapKitt
          </span>
          <span className="font-mono text-xs tracking-[0.08em] text-primary uppercase">
            Placement
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild className="hidden sm:inline-flex">
            <Link href={siteConfig.cta.href}>{siteConfig.cta.label}</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-sm px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 px-4">
                <Button asChild size="cta" className="w-full">
                  <Link href={siteConfig.cta.href}>{siteConfig.cta.label}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
