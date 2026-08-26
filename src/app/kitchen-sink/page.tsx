import type { Metadata } from "next";
import { ArrowRight, Upload } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { stages } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kitchen sink",
  description: "Internal component reference. Not part of the public site.",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "background", value: "#FBFAFF", use: "Page ground" },
  { name: "card", value: "#FFFFFF", use: "Cards, header, fields" },
  { name: "surface-alt", value: "#F5F2FD", use: "Quiet bands" },
  { name: "primary", value: "#6C3CE1", use: "CTA, links, rail" },
  { name: "violet-hover", value: "#5527CC", use: "Hover" },
  { name: "violet-light", value: "#8B5CF6", use: "Final CTA gradient" },
  { name: "tint", value: "#F1ECFF", use: "Badges, halo" },
  { name: "border", value: "#E7E3F2", use: "Every hairline" },
  { name: "ink", value: "#161327", use: "Headings" },
  { name: "muted-foreground", value: "#635C7A", use: "Body copy" },
  { name: "dim", value: "#8C86A3", use: "Captions" },
  { name: "stage-done", value: "#0E7F58", use: "Portal: complete" },
  { name: "stage-action", value: "#9A5B06", use: "Portal: your move" },
  { name: "stage-blocked", value: "#B01F52", use: "Portal: blocked" },
];

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-hairline py-6 first:border-t-0 sm:flex-row sm:items-start sm:gap-8">
      <div className="w-40 shrink-0 pt-1">
        <span className="font-mono text-xs tracking-[0.1em] text-caption uppercase">
          {label}
        </span>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function KitchenSinkPage() {
  return (
    <main>
      <Section className="pb-10">
        <SectionHeading
          as="h1"
          eyebrow="Internal · not indexed"
          title="Kitchen sink"
          lede="Every primitive in every state. If something here still looks like default shadcn grey, the token layer is not finished — this page is the phase 01 gate."
        />
      </Section>

      {/* ---------- tokens ---------- */}
      <Section divided tone="alt">
        <SectionHeading
          eyebrow="Tokens"
          title="Colour"
          lede="The ground is violet-biased, never a pure grey. Stage colours are semantic and are never used as a brand accent."
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {swatches.map((s) => (
            <div
              key={s.name}
              className="overflow-hidden rounded-lg border border-hairline bg-card"
            >
              <div
                className="h-14 border-b border-hairline"
                style={{ background: s.value }}
              />
              <div className="px-3 py-2 font-mono text-xs leading-relaxed">
                <div className="text-ink">{s.name}</div>
                <div className="text-caption">{s.value}</div>
                <div className="mt-1 font-sans text-[11px] text-caption">
                  {s.use}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------- type ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="Tokens"
          title="Type"
          lede="Inter for everything, JetBrains Mono for stage numbers, stat figures and uppercase labels."
        />
        <div className="mt-8 flex flex-col gap-6">
          <div>
            <Eyebrow>text-display</Eyebrow>
            <p className="mt-2 text-display text-ink">Placement, end to end</p>
          </div>
          <div>
            <Eyebrow>text-h2</Eyebrow>
            <p className="mt-2 text-h2 text-ink">What you never pay</p>
          </div>
          <div>
            <Eyebrow>text-h3</Eyebrow>
            <p className="mt-2 text-h3 text-ink">Interview preparation</p>
          </div>
          <div>
            <Eyebrow>body · 17px / 1.65 · 68ch</Eyebrow>
            <p className="mt-2 max-w-[var(--container-measure)] text-muted-foreground">
              We prepare you for every interview round with mock interviews and
              role-specific coaching, then debrief with you afterwards. We
              prepare you — we are never on the call.
            </p>
          </div>
          <div>
            <Eyebrow>mono · tabular figures</Eyebrow>
            <p className="mt-2 font-mono text-2xl text-ink" data-numeric>
              01 · 47 placements · 11.4 weeks
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- controls ---------- */}
      <Section divided tone="alt">
        <SectionHeading
          eyebrow="Primitives"
          title="Controls"
          lede="One primary button exists on any given page. Every other action is secondary, ghost or a text link."
        />
        <div className="mt-6">
          <Row label="Button · cta">
            <Button size="cta">
              Check my job readiness — free
              <ArrowRight />
            </Button>
            <Button size="cta" variant="outline">
              See the process
            </Button>
          </Row>
          <Row label="Button · variants">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </Row>
          <Row label="Button · sizes">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="cta">CTA</Button>
          </Row>
          <Row label="Button · states">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>
              Disabled outline
            </Button>
            <Button aria-invalid>Invalid</Button>
          </Row>
          <Row label="Badge">
            <Badge>Default</Badge>
            <Badge variant="secondary">OPT</Badge>
            <Badge variant="outline">STEM OPT</Badge>
            <Badge variant="destructive">Blocked</Badge>
          </Row>
        </div>
      </Section>

      {/* ---------- forms ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="Primitives"
          title="Form fields"
          lede="Errors say what went wrong and how to fix it. No apologies, no vagueness."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ks-name">Full name</Label>
            <Input id="ks-name" placeholder="Priya Raman" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ks-email">Work email</Label>
            <Input
              id="ks-email"
              type="email"
              defaultValue="not-an-email"
              aria-invalid
              aria-describedby="ks-email-error"
            />
            <p id="ks-email-error" className="text-sm text-destructive">
              Enter an email in the form name@example.com
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ks-auth">Work authorisation</Label>
            <Select>
              <SelectTrigger id="ks-auth" className="w-full">
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="f1">F1 student</SelectItem>
                <SelectItem value="opt">OPT</SelectItem>
                <SelectItem value="stem-opt">STEM OPT</SelectItem>
                <SelectItem value="h1b">H-1B</SelectItem>
                <SelectItem value="gc">Green card</SelectItem>
                <SelectItem value="citizen">US citizen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ks-disabled">Disabled field</Label>
            <Input id="ks-disabled" placeholder="Unavailable" disabled />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="ks-notes">Target roles</Label>
            <Textarea
              id="ks-notes"
              rows={4}
              placeholder="Senior data engineer, platform engineer — Bay Area or remote"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Resume</Label>
            <div className="mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-card px-6 py-10 text-center">
              <Upload className="size-5 text-caption" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Drop your resume here, or{" "}
                <span className="text-primary underline underline-offset-4">
                  browse files
                </span>
              </p>
              <p className="font-mono text-xs text-caption">
                PDF or DOCX · up to 5 MB
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- surfaces ---------- */}
      <Section divided tone="alt">
        <SectionHeading
          eyebrow="Primitives"
          title="Surfaces and disclosure"
          lede="Cards carry the one shadow token, and only when they sit on the tinted ground."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="shadow-raised">
            <CardHeader>
              <CardTitle>Resume &amp; LinkedIn</CardTitle>
              <CardDescription>Stage 02 of 08</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              An ATS-clean rewrite mapped to the keywords your target roles
              actually screen for.
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                What this includes
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-raised">
            <CardHeader>
              <CardTitle>Stage states</CardTitle>
              <CardDescription>Portal semantics</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <span className="w-fit rounded-md bg-stage-done-tint px-2 py-1 font-mono text-xs tracking-wide text-stage-done uppercase">
                Complete
              </span>
              <span className="w-fit rounded-md bg-stage-action-tint px-2 py-1 font-mono text-xs tracking-wide text-stage-action uppercase">
                Your move
              </span>
              <span className="w-fit rounded-md bg-stage-blocked-tint px-2 py-1 font-mono text-xs tracking-wide text-stage-blocked uppercase">
                Blocked
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-raised">
            <CardHeader>
              <CardTitle>Overlays</CardTitle>
              <CardDescription>Dialog and mobile nav</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Open dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>How we work</DialogTitle>
                    <DialogDescription>
                      We coach you before every round and debrief with you
                      after. We are never on the call itself.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button>Check my job readiness — free</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Open sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      This is the mobile navigation surface.
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 px-4">
                    {["Process", "Pricing", "Success stories", "FAQ"].map(
                      (i) => (
                        <a
                          key={i}
                          href="#"
                          className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                        >
                          {i}
                        </a>
                      ),
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-10" />

        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <Eyebrow>Tabs · backs the authorisation switcher</Eyebrow>
            <Tabs defaultValue="opt" className="mt-3">
              <TabsList>
                <TabsTrigger value="f1">F1</TabsTrigger>
                <TabsTrigger value="opt">OPT</TabsTrigger>
                <TabsTrigger value="h1b">H-1B</TabsTrigger>
              </TabsList>
              <TabsContent
                value="f1"
                className="pt-4 text-sm text-muted-foreground"
              >
                Positioning for CPT-eligible roles and internships that convert.
              </TabsContent>
              <TabsContent
                value="opt"
                className="pt-4 text-sm text-muted-foreground"
              >
                We work backwards from your 90-day unemployment clock and
                prioritise employers with a filing history.
              </TabsContent>
              <TabsContent
                value="h1b"
                className="pt-4 text-sm text-muted-foreground"
              >
                Transfer-ready targeting, focused on employers with recent
                filings rather than a one-off from years ago.
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Eyebrow>Accordion · FAQ</Eyebrow>
            <Accordion type="single" collapsible className="mt-3">
              <AccordionItem value="a">
                <AccordionTrigger>
                  Do you take a cut of my salary?
                </AccordionTrigger>
                <AccordionContent>
                  No. There is no monthly salary commission and no recurring
                  consultancy charge.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>
                  Will someone join my interview?
                </AccordionTrigger>
                <AccordionContent>
                  Never. We run mock interviews and coaching before each round
                  and debrief with you after. Anyone offering to sit on a live
                  interview is putting your offer and your status at risk.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      {/* ---------- rail preview ---------- */}
      <Section divided>
        <SectionHeading
          eyebrow="Phase 02 · next"
          title="The Placement Rail lands here"
          lede="Stage data already lives in lib/site.ts, so the rail, the process page and portal progress all read from one source."
        />
        <div className="mt-8 overflow-x-auto rounded-lg border border-hairline bg-card p-6 shadow-raised">
          <ol className="grid min-w-[900px] auto-cols-fr grid-flow-col">
            {stages.map((stage, i) => (
              <li key={stage.id} className="relative pt-8 pr-4">
                <span
                  aria-hidden
                  className={`absolute top-[11px] right-0 left-0 h-0.5 ${
                    i < 3 ? "bg-primary" : "bg-input"
                  }`}
                />
                <span
                  aria-hidden
                  className={`absolute top-[3px] left-0 size-4 rounded-full border-2 ${
                    i < 3
                      ? "border-primary bg-primary"
                      : i === 3
                        ? "border-primary bg-card ring-4 ring-tint"
                        : "border-input bg-card"
                  }`}
                />
                <span
                  className="font-mono text-xs tracking-[0.08em] text-caption"
                  data-numeric
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block text-sm font-semibold text-ink">
                  {stage.title}
                </span>
                <span className="mt-1 block text-xs text-caption">
                  {stage.summary}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Container className="py-10">
        <p className="font-mono text-xs text-caption">
          Phase 01 complete · tokens, fonts, primitives, layout components
        </p>
      </Container>
    </main>
  );
}
