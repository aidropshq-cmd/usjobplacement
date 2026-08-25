/**
 * The Job Search Readiness assessment.
 *
 * IMPORTANT — what this is and is not.
 *
 * The score below is computed from the answers a person gives, by the plain
 * arithmetic in `scoreAssessment`. It does NOT read a resume, call a model,
 * or compare anyone against real job-market data, because none of those
 * exist yet. Every surface that shows a score says so.
 *
 * The rules are deliberately legible rather than clever: each dimension is a
 * base value adjusted by a handful of stated factors. Anyone can read this
 * file and see exactly why a number came out the way it did — which is the
 * only defensible way to show someone a number about their own career.
 *
 * When real resume parsing exists, replace `scoreAssessment` and delete the
 * `isEstimate` flag. Nothing else needs to change.
 */

export const workAuthOptions = [
  { value: "f1", label: "F-1" },
  { value: "opt", label: "OPT" },
  { value: "stem-opt", label: "STEM OPT" },
  { value: "h1b", label: "H-1B" },
  { value: "gc", label: "Green Card" },
  { value: "citizen", label: "US Citizen" },
  { value: "other", label: "Other" },
] as const;

export const roleOptions = [
  "Software Engineer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Data Engineer",
  "Data Scientist",
  "Salesforce Developer",
  "QA Engineer",
  "Cybersecurity Engineer",
  "Business Analyst",
  "Product Manager",
] as const;

export const experienceOptions = [
  { value: "0-2", label: "0–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
] as const;

export const workModeOptions = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
  { value: "any", label: "Open to all" },
] as const;

/** Self-reported signals. These are what the score actually reads. */
export const resumeSignals = [
  {
    id: "tailored",
    label: "I tailor my resume for each application",
    dimension: "resume",
  },
  {
    id: "keywords",
    label: "My resume repeats wording from the job description",
    dimension: "ats",
  },
  {
    id: "metrics",
    label: "My bullet points include numbers or measurable outcomes",
    dimension: "resume",
  },
  {
    id: "plain_format",
    label: "My resume has no columns, tables, or graphics",
    dimension: "ats",
  },
  {
    id: "linkedin",
    label: "My LinkedIn matches my resume",
    dimension: "targeting",
  },
  {
    id: "tracking",
    label: "I track every application and its outcome",
    dimension: "targeting",
  },
  {
    id: "mocks",
    label: "I have done at least one mock interview recently",
    dimension: "interview",
  },
  {
    id: "stories",
    label: "I have STAR stories prepared for behavioural rounds",
    dimension: "interview",
  },
] as const;

export type WorkAuthValue = (typeof workAuthOptions)[number]["value"];
export type ExperienceValue = (typeof experienceOptions)[number]["value"];
export type WorkModeValue = (typeof workModeOptions)[number]["value"];
export type ResumeSignalId = (typeof resumeSignals)[number]["id"];
export type Dimension = "resume" | "targeting" | "ats" | "interview";

export type AssessmentAnswers = {
  workAuth: WorkAuthValue | "";
  role: string;
  experience: ExperienceValue | "";
  workMode: WorkModeValue | "";
  locations: string;
  signals: ResumeSignalId[];
};

export const emptyAnswers: AssessmentAnswers = {
  workAuth: "",
  role: "",
  experience: "",
  workMode: "",
  locations: "",
  signals: [],
};

export type DimensionScore = {
  id: Dimension;
  label: string;
  score: number;
  /** Why this number came out as it did. Shown to the person. */
  reason: string;
};

export type AssessmentResult = {
  overall: number;
  dimensions: DimensionScore[];
  priorities: { title: string; body: string }[];
  /** Always true today: derived from answers, not from a resume. */
  isEstimate: true;
};

const DIMENSION_LABELS: Record<Dimension, string> = {
  resume: "Resume Strength",
  targeting: "Targeting",
  ats: "ATS Readiness",
  interview: "Interview Readiness",
};

/** Each checked signal is worth this much on its dimension. */
const SIGNAL_WEIGHT = 14;
const BASE = 48;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreAssessment(answers: AssessmentAnswers): AssessmentResult {
  const checked = new Set<string>(answers.signals);

  const dimensions: DimensionScore[] = (
    Object.keys(DIMENSION_LABELS) as Dimension[]
  ).map((id) => {
    const relevant = resumeSignals.filter((s) => s.dimension === id);
    const hits = relevant.filter((s) => checked.has(s.id));

    let score = BASE + hits.length * SIGNAL_WEIGHT;

    // Experience nudges resume and interview readiness only — it says nothing
    // about whether a resume is machine-readable or a search is focused.
    if (id === "resume" || id === "interview") {
      if (answers.experience === "0-2") score -= 6;
      if (answers.experience === "6-10") score += 4;
      if (answers.experience === "10+") score += 6;
    }

    // A named target role is the single clearest targeting signal there is.
    if (id === "targeting" && answers.role) score += 8;

    // "Open to all" is not a preference, it is the absence of one, and an
    // unfocused search is measurably slower.
    if (id === "targeting" && answers.workMode === "any") score -= 5;

    const missing = relevant.filter((s) => !checked.has(s.id));
    const reason = missing.length
      ? `Biggest gap: ${missing[0].label.toLowerCase()}.`
      : "You reported every signal we check for here.";

    return { id, label: DIMENSION_LABELS[id], score: clamp(score), reason };
  });

  const overall = clamp(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );

  // Priorities are the weakest dimensions, worst first — not a fixed list.
  const priorities = [...dimensions]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((d) => ({
      title: PRIORITY_COPY[d.id].title,
      body: PRIORITY_COPY[d.id].body,
    }));

  return { overall, dimensions, priorities, isEstimate: true };
}

const PRIORITY_COPY: Record<Dimension, { title: string; body: string }> = {
  resume: {
    title: "Rewrite the resume around outcomes",
    body: "Bullet points that name a result — a number, a saving, a scale — outperform ones that list responsibilities. This is the fastest change with the largest effect.",
  },
  targeting: {
    title: "Narrow the target list",
    body: "A named role, a named seniority and a shortlist of employers beats applying broadly. Fewer, better-matched applications convert at a far higher rate.",
  },
  ats: {
    title: "Make the resume machine-readable",
    body: "Columns, tables and graphics break the parsers most US employers run before a human sees anything. Plain structure and the job description's own wording get you past that step.",
  },
  interview: {
    title: "Rehearse before the round, not during it",
    body: "Mock interviews with written feedback, and STAR stories prepared in advance, are what turn a first-round screen into an on-site.",
  },
};
