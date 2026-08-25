"use client";

import * as React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ApiError,
  applyExtractions,
  getExtractions,
  type Extraction,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Review what the parser read, before any of it reaches the profile.
 *
 * Two rules this interface exists to make visible:
 *
 *   1. Nothing is applied until the person ticks it. The API stages
 *      everything; this screen is where consent happens.
 *   2. Confidence is shown, not hidden. A name guessed at 40% is labelled
 *      "check this" rather than presented with the same authority as an email
 *      matched at 95%. Overstating certainty is how a parser quietly
 *      corrupts somebody's profile.
 */

const LABELS: Record<string, string> = {
  full_name: "Name",
  email: "Email",
  phone: "Phone",
  skills: "Skills and technologies",
  years_experience: "Years of experience",
  job_titles: "Job titles",
  education: "Education",
  certifications: "Certifications",
};

function ConfidenceTag({ value }: { value: number }) {
  const [text, tone] =
    value >= 0.8
      ? ["Confident", "bg-stage-done-tint text-stage-done"]
      : value >= 0.6
        ? ["Fairly sure", "bg-surface-alt text-muted-foreground"]
        : ["Check this", "bg-stage-action-tint text-stage-action"];

  return (
    <span
      className={cn(
        "shrink-0 rounded-sm px-2 py-0.5 font-mono text-[0.65rem] tracking-[0.08em] uppercase",
        tone,
      )}
      title={`Confidence ${Math.round(value * 100)}%`}
    >
      {text}
    </span>
  );
}

export function ResumeReview({
  resumeId,
  candidateToken,
}: {
  resumeId: number;
  candidateToken: string;
}) {
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState<Extraction[]>([]);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [edits, setEdits] = React.useState<Record<string, string>>({});
  const [droppedSkills, setDroppedSkills] = React.useState<Set<string>>(
    new Set(),
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getExtractions(resumeId, candidateToken);
        if (cancelled) return;
        setStatus(data.parse_status);
        setError(data.parse_error);
        setItems(data.extractions as Extraction[]);
      } catch {
        if (!cancelled) setError("Could not load your parsed resume.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId, candidateToken]);

  const applicable = items.filter((item) => item.applicable);
  const informational = items.filter((item) => !item.applicable);

  const textValue = (item: Extraction) =>
    edits[item.field] ??
    (Array.isArray(item.value)
      ? String(item.value[0] ?? "")
      : String(item.value));

  async function save() {
    const fields: Record<string, string | number | string[]> = {};
    for (const item of applicable) {
      if (!selected[item.field]) continue;
      if (item.field === "skills") {
        const kept = (item.value as string[]).filter(
          (s) => !droppedSkills.has(s),
        );
        if (kept.length) fields.skills = kept;
      } else if (item.field === "years_experience") {
        fields.years_experience = Number(textValue(item));
      } else {
        const value = textValue(item).trim();
        if (value) fields[item.field] = value;
      }
    }

    if (Object.keys(fields).length === 0) {
      toast.error("Tick at least one thing to add to your profile.");
      return;
    }

    setSaving(true);
    try {
      await applyExtractions(resumeId, candidateToken, fields);
      setSaved(true);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not save those changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Reading your resume…
      </p>
    );
  }

  if (status === "failed") {
    return (
      <div className="mt-4 rounded-sm bg-stage-action-tint px-4 py-3">
        <p className="flex items-start gap-2 text-sm text-stage-action">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong className="font-medium">
              We could not read text from that file.
            </strong>{" "}
            {error || "It may be a scan or an image."} Your resume is stored
            safely and a person will read it — nothing is lost.
          </span>
        </p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="mt-4 rounded-sm bg-stage-done-tint px-4 py-3">
        <p className="flex items-start gap-2 text-sm text-stage-done">
          <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Added to your profile. You can change any of it later.</span>
        </p>
      </div>
    );
  }

  if (applicable.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-hairline bg-surface-alt p-5 sm:p-6">
      <h3 className="text-h3 text-ink">What we read from your resume</h3>
      <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">
        Nothing below is on your profile yet. Tick what is right, correct what
        is not, and leave the rest.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {applicable.map((item) => {
          const isChecked = selected[item.field] ?? false;
          return (
            <div
              key={item.field}
              className="rounded-sm border border-hairline bg-card p-4"
            >
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.field]: !prev[item.field],
                    }))
                  }
                  className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {LABELS[item.field] ?? item.field}
                    </span>
                    <ConfidenceTag value={item.confidence} />
                  </span>
                  {item.current_value ? (
                    <span className="mt-1 block text-xs text-dim">
                      Currently:{" "}
                      {Array.isArray(item.current_value)
                        ? item.current_value.join(", ") || "empty"
                        : item.current_value || "empty"}
                    </span>
                  ) : null}
                </span>
              </label>

              {item.field === "skills" ? (
                <div className="mt-3 flex flex-wrap gap-2 pl-7">
                  {(item.value as string[]).map((skill) => {
                    const dropped = droppedSkills.has(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setDroppedSkills((prev) => {
                            const next = new Set(prev);
                            if (dropped) next.delete(skill);
                            else next.add(skill);
                            return next;
                          })
                        }
                        className={cn(
                          "cursor-pointer rounded-sm border px-2.5 py-1 text-xs transition-colors",
                          dropped
                            ? "border-input text-dim line-through"
                            : "border-primary bg-tint text-violet-ink",
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                  <span className="w-full text-xs text-dim">
                    Click any that are wrong to leave them out.
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-1.5 pl-7">
                  <Label htmlFor={`ex-${item.field}`} className="sr-only">
                    {LABELS[item.field] ?? item.field}
                  </Label>
                  <Input
                    id={`ex-${item.field}`}
                    value={textValue(item)}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [item.field]: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {informational.length ? (
        <div className="mt-5 border-t border-hairline pt-4">
          <p className="text-xs text-dim">
            Also found, kept for the person reviewing your file:{" "}
            {informational
              .map((item) =>
                Array.isArray(item.value)
                  ? `${LABELS[item.field] ?? item.field} (${item.value.length})`
                  : (LABELS[item.field] ?? item.field),
              )
              .join(" · ")}
          </p>
        </div>
      ) : null}

      <Button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-5 w-full sm:w-auto"
      >
        {saving ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Saving
          </>
        ) : (
          "Add selected to my profile"
        )}
      </Button>
    </div>
  );
}
