"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { track } from "@/lib/analytics";

/**
 * Mobile-only sticky CTA.
 *
 * Appears once the hero has scrolled away, so it never competes with the
 * hero's own buttons. Hidden entirely on the assessment route — offering
 * "check my readiness" to someone already doing it is noise.
 *
 * It reserves its own height via a spacer so it cannot cover the footer's
 * WhatsApp link, which is the overlap the brief asked to avoid.
 */
export function StickyCta() {
  const [shown, setShown] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/assessment") return null;

  return (
    <>
      {/* Keeps the fixed bar from ever sitting on top of footer content. */}
      <div aria-hidden className={shown ? "h-20 md:hidden" : "hidden"} />
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-background/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Link
          href="/assessment"
          onClick={() => track("hero_readiness_clicked", { source: "sticky" })}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Check my job readiness — free
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}
