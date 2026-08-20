import { cn } from "@/lib/utils";
import { Container } from "./container";

type SectionProps = React.ComponentProps<"section"> & {
  /** `tint` bands a section in violet tint; `alt` uses the quiet surface. */
  tone?: "default" | "alt" | "tint";
  /** Hairline rule above the section. Off for the first section after the hero. */
  divided?: boolean;
  containerWidth?: React.ComponentProps<typeof Container>["width"];
};

/**
 * Vertical rhythm for every page section, on the 8px scale. Owning the
 * padding here means no section can invent its own spacing.
 */
export function Section({
  className,
  tone = "default",
  divided = false,
  containerWidth = "default",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        tone === "alt" && "bg-surface-alt",
        tone === "tint" && "bg-tint",
        divided && "border-t border-hairline",
        className,
      )}
      {...props}
    >
      <Container width={containerWidth}>{children}</Container>
    </section>
  );
}
