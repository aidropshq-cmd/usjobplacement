"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import {
  ApiError,
  RESUME_ACCEPT,
  RESUME_MAX_MB,
  submitAssessment,
  uploadResume,
} from "@/lib/api";
import { siteConfig } from "@/lib/site";
import {
  emptyAnswers,
  experienceOptions,
  resumeSignals,
  roleOptions,
  scoreAssessment,
  workAuthOptions,
  workModeOptions,
  type AssessmentAnswers,
  type AssessmentResult,
  type ResumeSignalId,
} from "@/lib/assessment";
import { cn } from "@/lib/utils";

const STEPS = [
  "Where you are",
  "Target role",
  "Experience",
  "Location",
  "Your resume",
] as const;

/** Big tappable option button — 44px+ target on every breakpoint. */
function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-12 cursor-pointer rounded-sm border px-4 py-3 text-left text-sm font-medium transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-tint text-violet-ink"
          : "border-input bg-card text-muted-foreground hover:border-primary hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function AssessmentFlow() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<AssessmentAnswers>(emptyAnswers);
  const [customRole, setCustomRole] = React.useState("");
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<AssessmentResult | null>(null);

  React.useEffect(() => {
    track("assessment_started");
  }, []);

  const set = <K extends keyof AssessmentAnswers>(
    key: K,
    value: AssessmentAnswers[K],
  ) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const toggleSignal = (id: ResumeSignalId) =>
    setAnswers((prev) => ({
      ...prev,
      signals: prev.signals.includes(id)
        ? prev.signals.filter((s) => s !== id)
        : [...prev.signals, id],
    }));

  const canAdvance = [
    answers.workAuth !== "",
    answers.role !== "",
    answers.experience !== "",
    answers.workMode !== "",
    true, // the resume step is entirely optional
  ][step];

  const next = () => {
    track("assessment_step_completed", { step: step + 1, name: STEPS[step] });
    if (step === STEPS.length - 1) {
      const computed = scoreAssessment(answers);
      setResult(computed);
      track("assessment_completed", { score: computed.overall });
      track("score_viewed", { score: computed.overall });
      return;
    }
    setStep((s) => s + 1);
  };

  if (result) {
    return (
      <Results answers={answers} result={result} resumeFile={resumeFile} />
    );
  }

  return (
    <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
      {/* progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-sm text-dim">{STEPS[step]}</span>
        </div>
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label="Assessment progress"
        >
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        {step === 0 ? (
          <fieldset>
            <legend className="text-h3 text-ink">
              Where are you in your US career?
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {workAuthOptions.map((o) => (
                <Choice
                  key={o.value}
                  selected={answers.workAuth === o.value}
                  onClick={() => set("workAuth", o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
            <p className="mt-4 text-sm text-dim">
              This shapes how we plan a search. It is not legal advice, and we
              are not immigration attorneys.
            </p>
          </fieldset>
        ) : null}

        {step === 1 ? (
          <fieldset>
            <legend className="text-h3 text-ink">
              What role are you targeting?
            </legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {roleOptions.map((r) => (
                <Choice
                  key={r}
                  selected={answers.role === r}
                  onClick={() => {
                    set("role", r);
                    setCustomRole("");
                  }}
                >
                  {r}
                </Choice>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="custom-role">Something else</Label>
              <Input
                id="custom-role"
                value={customRole}
                placeholder="Site Reliability Engineer, Solutions Architect…"
                onChange={(e) => {
                  setCustomRole(e.target.value);
                  set("role", e.target.value.trim());
                }}
              />
            </div>
          </fieldset>
        ) : null}

        {step === 2 ? (
          <fieldset>
            <legend className="text-h3 text-ink">
              How much experience do you have?
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {experienceOptions.map((o) => (
                <Choice
                  key={o.value}
                  selected={answers.experience === o.value}
                  onClick={() => set("experience", o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
          </fieldset>
        ) : null}

        {step === 3 ? (
          <fieldset>
            <legend className="text-h3 text-ink">
              Where do you want to work?
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {workModeOptions.map((o) => (
                <Choice
                  key={o.value}
                  selected={answers.workMode === o.value}
                  onClick={() => set("workMode", o.value)}
                >
                  {o.label}
                </Choice>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Label htmlFor="locations">
                Preferred US locations{" "}
                <span className="font-normal text-dim">(optional)</span>
              </Label>
              <Input
                id="locations"
                value={answers.locations}
                placeholder="Austin, Dallas, Bay Area…"
                onChange={(e) => set("locations", e.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {step === 4 ? (
          <fieldset>
            <legend className="text-h3 text-ink">
              Tell us about your resume
            </legend>
            <p className="mt-3 max-w-[58ch] text-sm text-muted-foreground">
              Tick everything that is true today. Your score is calculated from
              these answers.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {resumeSignals.map((s) => {
                const checked = answers.signals.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors",
                      "focus-within:ring-3 focus-within:ring-ring/50",
                      checked
                        ? "border-primary bg-tint text-violet-ink"
                        : "border-input bg-card text-muted-foreground hover:border-primary",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSignal(s.id)}
                      className="size-4 shrink-0 accent-[var(--primary)] outline-none"
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>

            {/* Upload is honest about not being live yet. */}
            <div className="mt-6 rounded-sm border border-dashed border-input bg-surface-alt px-5 py-5">
              <div className="flex items-start gap-3">
                <Upload
                  className="mt-0.5 size-4 shrink-0 text-dim"
                  aria-hidden
                />
                <div>
                  <Label
                    htmlFor="resume"
                    className="cursor-pointer text-sm font-medium text-ink"
                  >
                    Attach your resume (PDF or DOCX, optional)
                  </Label>
                  <input
                    id="resume"
                    type="file"
                    accept={RESUME_ACCEPT}
                    className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-sm file:border file:border-input file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return setResumeFile(null);
                      if (file.size > RESUME_MAX_MB * 1024 * 1024) {
                        toast.error(
                          `That file is over ${RESUME_MAX_MB} MB. Try a smaller one.`,
                        );
                        e.target.value = "";
                        return setResumeFile(null);
                      }
                      // Held in the browser only. The upload happens after
                      // the email step, because no candidate exists to own
                      // the file until then.
                      setResumeFile(file);
                    }}
                  />
                  {resumeFile ? (
                    <p className="mt-2 text-sm text-ink">{resumeFile.name}</p>
                  ) : null}
                  <p className="mt-3 flex items-start gap-2 text-sm text-dim">
                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>
                      PDF or DOCX, up to {RESUME_MAX_MB} MB. It is uploaded
                      after you enter your email on the next screen, stored
                      privately, and never sent to any third party or used for
                      analytics. Your score does not use it.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </fieldset>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="w-full sm:w-auto"
        >
          <ArrowLeft aria-hidden />
          Back
        </Button>
        <Button
          type="button"
          size="cta"
          onClick={next}
          disabled={!canAdvance}
          className="w-full sm:w-auto"
        >
          {step === STEPS.length - 1 ? "See my readiness score" : "Continue"}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ results */

function ScoreBar({
  label,
  score,
  reason,
}: {
  label: string;
  score: number;
  reason: string;
}) {
  return (
    <div className="border-t border-hairline pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span className="font-mono text-lg text-ink" data-numeric>
          {score}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
        role="img"
        aria-label={`${label}: ${score} out of 100`}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-dim">{reason}</p>
    </div>
  );
}

type UploadState =
  | { kind: "none" }
  | { kind: "busy"; stage: "requesting" | "uploading" | "confirming" }
  | { kind: "done"; filename: string }
  | { kind: "error"; message: string };

function Results({
  answers,
  result,
  resumeFile,
}: {
  answers: AssessmentAnswers;
  result: AssessmentResult;
  resumeFile: File | null;
}) {
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "" });
  const [error, setError] = React.useState("");
  const [upload, setUpload] = React.useState<UploadState>({ kind: "none" });
  const [token, setToken] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Enter your first name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      return setError("Enter an email in the form name@example.com");

    setBusy(true);
    track("lead_form_submitted", {
      source: "assessment",
      score: result.overall,
    });
    try {
      const byId = Object.fromEntries(
        result.dimensions.map((d) => [d.id, d.score]),
      );
      const created = await submitAssessment({
        full_name: form.name.trim(),
        email: form.email.trim(),
        work_status_pref: answers.workAuth || "other",
        target_role: answers.role,
        experience_level: answers.experience,
        work_mode: answers.workMode,
        preferred_locations: answers.locations,
        answers: { signals: answers.signals },
        overall: result.overall,
        resume_score: byId.resume ?? 0,
        targeting_score: byId.targeting ?? 0,
        ats_score: byId.ats ?? 0,
        interview_score: byId.interview ?? 0,
      });
      setToken(created.candidate_token);
      setSent(true);

      // The candidate only exists once they give an email, so the upload can
      // only happen now. It is reported separately from the assessment: a
      // failed upload must not make the whole submission look failed.
      if (resumeFile) {
        void runUpload(resumeFile, created.candidate_token);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Try again, or email us directly.",
      );
    } finally {
      setBusy(false);
    }
  };

  async function runUpload(file: File, candidateToken: string) {
    setUpload({ kind: "busy", stage: "requesting" });
    try {
      const done = await uploadResume(file, candidateToken, (stage) =>
        setUpload({ kind: "busy", stage }),
      );
      setUpload({ kind: "done", filename: done.filename });
      // Size only. The file's contents never reach analytics.
      track("resume_uploaded", { size: file.size });
    } catch (err) {
      setUpload({
        kind: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "The upload did not complete. You can try again.",
      });
    }
  }

  const uploadNotice =
    upload.kind === "busy" ? (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {upload.stage === "requesting" && "Preparing your upload…"}
        {upload.stage === "uploading" && "Uploading your resume…"}
        {upload.stage === "confirming" && "Confirming the upload…"}
      </p>
    ) : upload.kind === "done" ? (
      <p className="mt-4 flex items-start gap-2 text-sm text-stage-done">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <strong className="font-medium">{upload.filename}</strong> uploaded
          and stored privately.
        </span>
      </p>
    ) : upload.kind === "error" ? (
      <div className="mt-4 rounded-sm bg-stage-blocked-tint px-4 py-3">
        <p className="text-sm text-stage-blocked">{upload.message}</p>
        {resumeFile ? (
          <button
            type="button"
            onClick={() => void runUpload(resumeFile, token)}
            className="mt-2 cursor-pointer rounded-sm text-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Try the upload again
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-mono text-xs tracking-[0.1em] text-primary uppercase">
              Your US job search readiness
            </span>
            <p className="mt-3 flex items-baseline gap-2">
              <span
                className="font-mono text-6xl leading-none font-bold text-ink"
                data-numeric
              >
                {result.overall}
              </span>
              <span className="font-mono text-xl text-dim">/ 100</span>
            </p>
          </div>
          <p className="max-w-[34ch] rounded-sm bg-surface-alt px-4 py-3 text-sm text-muted-foreground">
            <strong className="text-ink">Estimated from your answers.</strong>{" "}
            No resume was read and no model was used — the arithmetic is in{" "}
            <code className="font-mono text-xs">lib/assessment.ts</code>.
          </p>
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {result.dimensions.map((d) => (
            <ScoreBar
              key={d.id}
              label={d.label}
              score={d.score}
              reason={d.reason}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-h3 text-ink">Your top opportunities</h2>
        <ol className="mt-5 flex flex-col gap-5">
          {result.priorities.map((p, i) => (
            <li
              key={p.title}
              className="flex gap-4 border-t border-hairline pt-4"
            >
              <span
                className="font-mono text-sm text-primary"
                data-numeric
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block font-semibold text-ink">{p.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {p.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      {sent ? (
        <div className="rounded-lg border border-hairline bg-card p-6 shadow-card sm:p-8">
          <CheckCircle2 className="size-7 text-stage-done" aria-hidden />
          <h2 className="mt-4 text-h3 text-ink">
            Your action plan is being prepared
          </h2>
          <p className="mt-3 max-w-[54ch] text-muted-foreground">
            A person reviews your answers and replies within one business day.
            Nothing is charged for this.
          </p>
          {uploadNotice}
          <ul className="mt-5 flex flex-col gap-2.5 text-sm">
            {[
              "Email your resume so it can be reviewed alongside this",
              "Read the eight stages so you know what happens next",
              "Book a free career review if you would rather talk it through",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span className="text-muted-foreground">{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/process">See the eight stages</Link>
            </Button>
            <Button asChild>
              <Link
                href={siteConfig.cta.href}
                onClick={() =>
                  track("consultation_clicked", { from: "assessment" })
                }
              >
                Book a free career review
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="rounded-lg border border-primary/25 bg-tint p-6 sm:p-8"
        >
          <h2 className="text-h3 text-ink">
            Get your free job search action plan
          </h2>
          <p className="mt-2 max-w-[54ch] text-sm text-muted-foreground">
            We turn this into a written plan for your target role, and a person
            reviews it. No charge, and no obligation to buy anything.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="a-name">First name</Label>
              <Input
                id="a-name"
                autoComplete="given-name"
                value={form.name}
                onFocus={() =>
                  track("lead_form_started", { source: "assessment" })
                }
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="a-email">Email</Label>
              <Input
                id="a-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            size="cta"
            className="mt-6 w-full sm:w-auto"
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Sending
              </>
            ) : (
              <>
                Send my free action plan
                <ArrowRight aria-hidden />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
