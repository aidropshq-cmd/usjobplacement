import { cn } from "@/lib/utils";

/**
 * Marks a block as sample UI rather than live data.
 *
 * Used anywhere the interface shows numbers that are not real: the dashboard
 * preview, matched jobs, the tracker. Showing an invented figure without this
 * label would be a fabricated statistic, which this site does not do.
 */
export function DemoLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-surface-alt px-2 py-1 font-mono text-[0.65rem] font-medium tracking-[0.1em] text-caption uppercase",
        className,
      )}
    >
      Sample interface · not live data
    </span>
  );
}
