import { cn } from "@/lib/utils";

type ContainerProps = React.ComponentProps<"div"> & {
  /** `wide` for full section grids, `text` to hold running copy at 68ch. */
  width?: "default" | "wide" | "text";
};

/**
 * The only place horizontal page padding is defined. Sections never set their
 * own — that is what stops per-page padding drift as the site grows.
 */
export function Container({
  className,
  width = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8",
        width === "default" && "max-w-[1120px]",
        width === "wide" && "max-w-[1320px]",
        width === "text" && "max-w-[var(--container-measure)]",
        className,
      )}
      {...props}
    />
  );
}
