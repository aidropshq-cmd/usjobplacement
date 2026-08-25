import { Check } from "lucide-react";

/**
 * "What you never pay" — honesty rendered as a layout.
 *
 * The strongest differentiator in the original service description was buried
 * in a bullet list. Here it is a subtraction: three struck-through charges
 * against the one thing that does apply.
 *
 * No competitor pricing is named. We do not have sourced figures for what
 * other services charge, and asserting them would be exactly the kind of
 * invented number this brand refuses elsewhere.
 */
const neverPay = [
  {
    title: "A percentage of your monthly salary",
    note: "Not for a year, not for two, not at all.",
  },
  {
    title: "A recurring consultancy retainer",
    note: "Nothing bills again once the engagement is agreed.",
  },
  {
    title: "A placement fee taken from your offer",
    note: "Your offer is yours. We are not paid out of it.",
  },
];

export function NeverPay() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <ul className="flex flex-col">
        {neverPay.map((item) => (
          <li
            key={item.title}
            className="flex flex-col gap-1 border-b border-hairline py-6 first:pt-0 last:border-b-0"
          >
            <span className="text-xl font-semibold text-dim line-through decoration-primary/50 decoration-2 sm:text-2xl">
              {item.title}
            </span>
            <span className="text-sm text-muted-foreground">{item.note}</span>
          </li>
        ))}
      </ul>

      <div className="self-start rounded-lg border border-primary/25 bg-tint p-6 sm:p-8">
        <span className="font-mono text-xs tracking-[0.12em] text-violet-ink uppercase">
          What you do pay
        </span>
        <p className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-ink">
          One flat engagement fee, agreed in writing before any work starts.
        </p>
        <ul className="mt-5 flex flex-col gap-2.5">
          {[
            "Quoted on the career review call, not after",
            "Covers all eight stages",
            "No charge tied to whether you accept an offer",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-muted-foreground">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
