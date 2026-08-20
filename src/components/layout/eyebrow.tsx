import { cn } from "@/lib/utils";

/**
 * Small uppercase mono label above a heading. Set in JetBrains Mono so the
 * label reads as instrumentation rather than decoration — the same face the
 * Placement Rail uses for its stage numbers.
 */
export function Eyebrow({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-mono text-label font-medium tracking-[0.12em] text-primary uppercase",
        className,
      )}
      {...props}
    />
  );
}
