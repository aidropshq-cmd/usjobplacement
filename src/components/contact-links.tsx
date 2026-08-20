import { Mail, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";

/**
 * Email and WhatsApp, side by side.
 *
 * The WhatsApp link renders only when a number is configured. An unset number
 * would produce `wa.me/` — a link that loads a broken WhatsApp page — so it is
 * better to show nothing than to show a contact route that fails.
 */
export function ContactLinks({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm";
}) {
  const { email, whatsapp } = siteConfig.contact;
  const text = size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-6 gap-y-2", className)}
    >
      <a
        href={`mailto:${email}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
          text,
        )}
      >
        <Mail className="size-4 shrink-0" aria-hidden />
        {email}
      </a>

      {whatsapp.number ? (
        <a
          href={`https://wa.me/${whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2 rounded-sm text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50",
            text,
          )}
        >
          <MessageCircle className="size-4 shrink-0" aria-hidden />
          {whatsapp.display || whatsapp.number}
          <span className="sr-only">on WhatsApp</span>
        </a>
      ) : null}
    </div>
  );
}
