/**
 * Trust strip.
 *
 * Deliberately NOT "candidates placed" or "average weeks to offer" — we do not
 * have audited numbers for those yet, and inventing them would break the same
 * accuracy rule the H-1B tooling is built on. Every figure here is a fact about
 * how the engagement is structured, so all four are verifiable today.
 *
 * When real outcome data exists, replace these with it — a measured placement
 * count beats a structural claim.
 */
const facts = [
  {
    figure: "0%",
    label: "of your salary",
    note: "No commission, no revenue share, ever",
  },
  {
    figure: "8",
    label: "documented stages",
    note: "You can see exactly where you are",
  },
  {
    figure: "1",
    label: "flat engagement",
    note: "Agreed in writing before we start",
  },
  {
    figure: "0",
    label: "people on your call",
    note: "We coach you before, never during",
  },
];

export function TrustStrip() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="border-t border-hairline pt-5">
          <dt className="sr-only">{fact.label}</dt>
          <dd>
            <span
              className="block font-mono text-4xl leading-none font-bold tracking-[-0.02em] text-primary"
              data-numeric
            >
              {fact.figure}
            </span>
            <span className="mt-2 block text-sm font-semibold text-ink">
              {fact.label}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {fact.note}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
