"use client";

import * as React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { immigrationDisclaimer, workAuthorizations } from "@/lib/site";

/**
 * The personalisation moment. Selecting a work-authorisation status rewrites
 * the copy beneath it — this is the anxiety most visitors arrive with, and
 * nothing else in this market's search results addresses it directly.
 *
 * Every panel carries the disclaimer: we plan searches, we are not attorneys.
 */
export function AuthorizationSwitcher() {
  return (
    <Tabs defaultValue="opt" className="gap-6">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 p-1">
        {workAuthorizations.map((auth) => (
          <TabsTrigger
            key={auth.id}
            value={auth.id}
            className="min-h-10 cursor-pointer px-3.5 py-2 text-sm"
          >
            {auth.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {workAuthorizations.map((auth) => (
        <TabsContent key={auth.id} value={auth.id} className="mt-0">
          <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:gap-10">
              <div className="md:flex-1">
                <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
                  {auth.full}
                </span>
                <h3 className="mt-2 text-h3 text-ink">{auth.headline}</h3>
                <p className="mt-3 max-w-[58ch] text-muted-foreground">
                  {auth.body}
                </p>
              </div>

              <div className="shrink-0 rounded-sm bg-surface-alt p-4 md:w-60">
                <span className="font-mono text-xs tracking-[0.1em] text-dim uppercase">
                  Where we focus
                </span>
                <p className="mt-2 text-sm font-medium text-ink">
                  {auth.focus}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}

      <p className="max-w-[68ch] text-sm text-dim">{immigrationDisclaimer}</p>
    </Tabs>
  );
}
