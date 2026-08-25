import type { Metadata } from "next";

import { AssessmentFlow } from "@/components/assessment/assessment-flow";
import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/layout/eyebrow";

export const metadata: Metadata = {
  title: "Free US job search readiness assessment",
  description:
    "Five questions and a readiness score across resume strength, targeting, ATS readiness and interview preparation — with the three things worth fixing first. Free, no call required.",
};

export default function AssessmentPage() {
  return (
    <main className="flex-1">
      <Container className="py-14 sm:py-20">
        <div className="flex flex-col gap-4">
          <Eyebrow>Free · no call required</Eyebrow>
          <h1 className="max-w-[20ch] text-display">
            Check your US job search readiness
          </h1>
          <p className="max-w-[60ch] text-lg text-muted-foreground">
            Five questions, about two minutes. You get a score across four
            dimensions and the three things worth fixing first — before anyone
            asks you to book anything.
          </p>
        </div>

        <div className="mt-10 max-w-3xl">
          <AssessmentFlow />
        </div>
      </Container>
    </main>
  );
}
