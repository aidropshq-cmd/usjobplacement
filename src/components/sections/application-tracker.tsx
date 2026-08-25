import { DemoLabel } from "@/components/demo-label";

/** Pipeline stages an application moves through. */
const PIPELINE = [
  "Saved",
  "Applied",
  "Recruiter screen",
  "Technical",
  "Manager",
  "Offer",
  "Accepted",
] as const;

/** Illustrative rows. No real employers are named — see DashboardPreview. */
const ROWS = [
  {
    company: "Cloud infrastructure company",
    role: "DevOps Engineer",
    date: "12 Aug",
    status: "Technical",
    next: "System design round Thu",
  },
  {
    company: "Healthcare SaaS",
    role: "Platform Engineer",
    date: "09 Aug",
    status: "Recruiter screen",
    next: "Send availability",
  },
  {
    company: "Fintech scale-up",
    role: "SRE",
    date: "04 Aug",
    status: "Applied",
    next: "Follow up Friday",
  },
];

export function ApplicationTracker() {
  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {PIPELINE.map((stage, i) => (
          <li key={stage} className="flex items-center gap-2">
            <span
              className={`rounded-sm px-2.5 py-1.5 text-xs font-medium ${
                i < 4 ? "bg-tint text-violet-ink" : "bg-surface-alt text-dim"
              }`}
            >
              {stage}
            </span>
            {i < PIPELINE.length - 1 ? (
              <span className="text-dim" aria-hidden>
                ›
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="rounded-lg border border-hairline bg-card shadow-card">
        <div className="flex items-center justify-between gap-4 border-b border-hairline px-5 py-3">
          <span className="text-sm font-medium text-ink">
            Your applications
          </span>
          <DemoLabel />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                {["Company", "Role", "Applied", "Status", "Next action"].map(
                  (h) => (
                    <th
                      key={h}
                      className="border-b border-hairline bg-surface-alt px-5 py-2.5 text-left font-mono text-[0.65rem] font-medium tracking-[0.1em] text-dim uppercase"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.company}>
                  <td className="border-b border-hairline px-5 py-3 font-medium text-ink">
                    {r.company}
                  </td>
                  <td className="border-b border-hairline px-5 py-3 text-muted-foreground">
                    {r.role}
                  </td>
                  <td className="border-b border-hairline px-5 py-3 text-muted-foreground">
                    {r.date}
                  </td>
                  <td className="border-b border-hairline px-5 py-3">
                    <span className="rounded-sm bg-tint px-2 py-1 text-xs font-medium text-violet-ink">
                      {r.status}
                    </span>
                  </td>
                  <td className="border-b border-hairline px-5 py-3 text-muted-foreground">
                    {r.next}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
