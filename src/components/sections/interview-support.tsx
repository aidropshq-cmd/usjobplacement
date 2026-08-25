import { Check } from "lucide-react";

/**
 * Interview preparation.
 *
 * Everything listed is human-delivered work that the service actually does.
 * There is deliberately no "AI mock interview" or automated scoring here —
 * that product does not exist, and listing it would be describing software
 * nobody has built.
 */
const FEATURES = [
  "Questions built from your own resume, not a generic bank",
  "Technical rounds for your specific stack",
  "Behavioural rounds with STAR stories prepared in advance",
  "Written feedback after every mock",
  "A debrief after every real round, and a revised plan for the next",
];

export function InterviewSupport() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <div>
        <ul className="flex flex-col gap-3">
          {FEATURES.map((f) => (
            <li
              key={f}
              className="flex items-start gap-3 border-t border-hairline pt-3"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 rounded-sm border border-primary/25 bg-tint px-4 py-3 text-sm text-violet-ink">
          We coach you before every round and debrief with you after. We prepare
          you — we are never on the call.
        </p>
      </div>

      <div className="rounded-lg border border-hairline bg-card p-6 shadow-card">
        <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
          Example prep sheet
        </span>
        <dl className="mt-4 flex flex-col gap-3 border-b border-hairline pb-4 text-sm">
          {[
            ["Role", "Senior DevOps Engineer"],
            ["Round", "System design, 60 minutes"],
            ["Focus", "Multi-region failover, cost control"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-20 shrink-0 text-dim">{k}</dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <ol className="mt-4 flex flex-col gap-2.5 text-sm text-muted-foreground">
          {[
            "Walk through the migration on your resume — what broke, what you changed",
            "Design a failover for a service with a 15-minute recovery objective",
            "Tell me about a time you cut infrastructure cost without cutting reliability",
          ].map((q, i) => (
            <li key={q} className="flex gap-3">
              <span
                className="font-mono text-xs text-primary"
                data-numeric
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {q}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
