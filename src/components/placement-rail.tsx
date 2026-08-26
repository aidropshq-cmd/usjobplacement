"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { stages } from "@/lib/site";

/**
 * The Placement Rail — the site's signature element.
 *
 * The product IS an eight-stage process, so the process is the hero. This is
 * the ARIA tabs pattern: a rail of stage nodes selects the panel below it.
 * Horizontal on desktop, vertical on mobile, keyboard-navigable either way.
 *
 * Manual activation (arrows move focus, Enter/Space selects) rather than
 * automatic — the panels carry enough text that auto-switching on arrow key
 * would talk over a screen reader mid-sentence.
 */
export function PlacementRail({ className }: { className?: string }) {
  const [selected, setSelected] = React.useState(0);
  const [focused, setFocused] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const move = (to: number) => {
    const next = (to + stages.length) % stages.length;
    setFocused(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        move(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        move(i - 1);
        break;
      case "Home":
        e.preventDefault();
        move(0);
        break;
      case "End":
        e.preventDefault();
        move(stages.length - 1);
        break;
    }
  };

  const active = stages[selected];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* ---- the rail ---- */}
      <div
        role="tablist"
        aria-label="The eight stages of the placement process"
        aria-orientation="horizontal"
        className={cn(
          "flex flex-col gap-0",
          "md:-mx-2 md:grid md:auto-cols-fr md:grid-flow-col md:overflow-x-auto md:px-2 md:pb-1",
        )}
      >
        {stages.map((stage, i) => {
          const isSelected = i === selected;
          const isPast = i < selected;

          return (
            <button
              key={stage.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`rail-tab-${stage.id}`}
              aria-selected={isSelected}
              aria-controls={`rail-panel-${stage.id}`}
              tabIndex={i === focused ? 0 : -1}
              onClick={() => {
                setSelected(i);
                setFocused(i);
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "group relative cursor-pointer text-left outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                // mobile: a vertical list with the connector running down the left
                "flex items-start gap-4 rounded-sm py-3 pr-2 pl-0",
                // desktop: a horizontal rail with the connector running across
                // the top. Flex-column rather than block because a <button>
                // vertically centres its content, which drops a node with a
                // shorter summary out of line with the rest of the rail.
                "md:min-w-[9.5rem] md:flex-col md:items-stretch md:justify-start md:gap-0 md:pt-9 md:pr-4 md:pb-2 md:pl-0",
              )}
            >
              {/* connector — horizontal on desktop, vertical on mobile */}
              <span
                aria-hidden
                className={cn(
                  "absolute transition-colors duration-300",
                  "top-8 -bottom-[1.125rem] left-[7px] w-0.5",
                  "md:top-[13px] md:right-0 md:bottom-auto md:left-0 md:h-0.5 md:w-auto",
                  i === stages.length - 1 && "hidden md:block",
                  isPast || isSelected ? "bg-primary" : "bg-border",
                )}
              />

              {/* node */}
              <span
                aria-hidden
                className={cn(
                  "relative z-10 mt-1.5 block size-4 shrink-0 rounded-full border-2 transition-all duration-300",
                  "md:absolute md:top-[5px] md:left-0 md:mt-0",
                  isPast && "border-primary bg-primary",
                  isSelected && "border-primary bg-card ring-4 ring-tint",
                  !isPast && !isSelected && "border-border bg-card",
                  !isSelected && "group-hover:border-primary",
                )}
              />

              <span className="block md:mt-0">
                <span
                  className={cn(
                    "block font-mono text-xs tracking-[0.08em] transition-colors",
                    isSelected ? "text-primary" : "text-caption",
                  )}
                  data-numeric
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-sm font-semibold transition-colors",
                    // fixed height so a two-line title does not push its
                    // deliverable out of line with its neighbours on the rail
                    "md:min-h-[2.5rem]",
                    isSelected ? "text-ink" : "text-muted-foreground",
                    "group-hover:text-ink",
                  )}
                >
                  {stage.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-caption md:hidden">
                  {stage.deliverable}
                </span>
                {/* The deliverable, not the summary. When the duplicate
                    "eight things you actually hold" list was removed from the
                    homepage, this is where its value moved — a visitor who
                    never clicks a node still sees what each stage produces. */}
                <span className="mt-0.5 hidden text-xs leading-snug text-caption md:block">
                  {stage.deliverable}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ---- the panel the rail drives ---- */}
      <div
        role="tabpanel"
        id={`rail-panel-${active.id}`}
        aria-labelledby={`rail-tab-${active.id}`}
        tabIndex={0}
        className="mt-6 rounded-lg border border-hairline bg-card p-6 shadow-raised outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:p-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
          <div className="md:flex-1">
            <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
              Stage {String(selected + 1).padStart(2, "0")} of 08
            </span>
            <h3 className="mt-2 text-h3 text-ink">{active.title}</h3>
            <p className="mt-3 max-w-[58ch] text-muted-foreground">
              {active.detail}
            </p>
          </div>

          <div className="shrink-0 rounded-sm bg-surface-alt p-4 md:w-64">
            <span className="font-mono text-xs tracking-[0.1em] text-caption uppercase">
              You end up with
            </span>
            <p className="mt-2 text-sm font-medium text-ink">
              {active.deliverable}
            </p>
          </div>
        </div>

        {selected < stages.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              setSelected(selected + 1);
              setFocused(selected + 1);
            }}
            className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Next: {stages[selected + 1].title}
            <ArrowRight className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
