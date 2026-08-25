import { Briefcase, MapPin, Target } from "lucide-react";

import { DemoLabel } from "@/components/demo-label";

/**
 * Sample job-search dashboard.
 *
 * Every number here is invented for illustration, and the DemoLabel says so
 * on the card itself — not in small print elsewhere. There is no job data
 * source and no application store behind this yet.
 *
 * Job titles are generic role names on purpose. Naming real employers, or
 * implying they are hiring or sponsor visas, would be a fabricated claim
 * about a third party.
 */

const stats = [
  { label: "Applications", value: "12" },
  { label: "Interviews", value: "2" },
  { label: "Offers", value: "0" },
];

const matches = [
  { role: "AWS DevOps Engineer", place: "Remote — US", match: 94 },
  { role: "Cloud Engineer", place: "Texas — Hybrid", match: 88 },
  { role: "Platform Engineer", place: "Remote — US", match: 81 },
];

export function DashboardPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-hairline bg-card p-5 shadow-card sm:p-6">
      <DemoLabel className="mb-4" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
            Job search readiness
          </span>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span
              className="font-mono text-4xl leading-none font-bold text-ink"
              data-numeric
            >
              74
            </span>
            <span className="font-mono text-sm text-caption">/ 100</span>
          </p>
        </div>
      </div>

      <dl className="mt-6 flex flex-col gap-3">
        {[
          { label: "Resume", value: 82 },
          { label: "Targeting", value: 68 },
          { label: "ATS Ready", value: 77 },
          { label: "Interview", value: 65 },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <dt className="w-24 shrink-0 text-sm text-muted-foreground">
              {row.label}
            </dt>
            <dd className="flex flex-1 items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${row.value}%` }}
                />
              </span>
              <span
                className="w-7 text-right font-mono text-sm text-ink"
                data-numeric
              >
                {row.value}
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-hairline pt-5">
        {stats.map((s) => (
          <div key={s.label}>
            <span className="block font-mono text-2xl text-ink" data-numeric>
              {s.value}
            </span>
            <span className="mt-0.5 block text-xs text-caption">{s.label}</span>
          </div>
        ))}
      </div>

      {!compact ? (
        <>
          <div className="mt-6 flex flex-col gap-2 border-t border-hairline pt-5 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Target className="size-3.5 shrink-0 text-caption" aria-hidden />
              Target role:{" "}
              <span className="font-medium text-ink">
                Senior DevOps Engineer
              </span>
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-caption" aria-hidden />
              United States · Remote or hybrid
            </span>
          </div>

          <ul className="mt-5 flex flex-col gap-2.5">
            {matches.map((m) => (
              <li
                key={m.role}
                className="flex items-center justify-between gap-3 rounded-sm border border-hairline px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                    <Briefcase
                      className="size-3.5 shrink-0 text-caption"
                      aria-hidden
                    />
                    {m.role}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-caption">
                    {m.place}
                  </span>
                </span>
                <span className="shrink-0 rounded-sm bg-tint px-2 py-1 font-mono text-xs text-violet-ink">
                  {m.match}%
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
