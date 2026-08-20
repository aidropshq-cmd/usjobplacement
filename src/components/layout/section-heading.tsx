import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  /** Headings are left-aligned by default — centering everything is a tell. */
  align?: "start" | "center";
  as?: "h1" | "h2";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "start",
  as: Heading = "h2",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        className={cn(
          Heading === "h1" ? "text-display" : "text-h2",
          "max-w-[20ch]",
        )}
      >
        {title}
      </Heading>
      {lede ? (
        <p className="max-w-[var(--container-measure)] text-muted-foreground">
          {lede}
        </p>
      ) : null}
    </div>
  );
}
