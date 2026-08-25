"""Candidate-side data model.

Scope rule for this whole file: collect what a job search actually needs and
nothing more. `work_status_pref` exists to filter jobs, not to hold a case
file — there is no visa number, no I-94, no SEVIS id, no document expiry
anywhere here, because none of it improves a search result and all of it
would be sensitive data we would then have to protect, justify and delete.
"""

from django.db import models
from django.utils import timezone


class WorkStatusPref(models.TextChoices):
    """Mirrors the frontend's workAuthOptions. A search filter, not a status
    record — see the note at the top of this file."""

    F1 = "f1", "F-1"
    OPT = "opt", "OPT"
    STEM_OPT = "stem-opt", "STEM OPT"
    H1B = "h1b", "H-1B"
    GREEN_CARD = "gc", "Green Card"
    CITIZEN = "citizen", "US Citizen"
    OTHER = "other", "Other"


class ExperienceLevel(models.TextChoices):
    ENTRY = "0-2", "0–2 years"
    MID = "3-5", "3–5 years"
    SENIOR = "6-10", "6–10 years"
    PRINCIPAL = "10+", "10+ years"


class WorkMode(models.TextChoices):
    REMOTE = "remote", "Remote"
    HYBRID = "hybrid", "Hybrid"
    ONSITE = "onsite", "On-site"
    ANY = "any", "Open to all"


class Candidate(models.Model):
    """One row per person. Keyed on email, which is the identity the funnel
    already collects and verifies."""

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=32, blank=True)

    target_role = models.CharField(max_length=120, blank=True)
    experience_level = models.CharField(
        max_length=8, choices=ExperienceLevel.choices, blank=True
    )
    work_status_pref = models.CharField(
        max_length=16, choices=WorkStatusPref.choices, blank=True
    )
    work_mode = models.CharField(max_length=8, choices=WorkMode.choices, blank=True)
    preferred_locations = models.JSONField(default=list, blank=True)
    skills = models.JSONField(default=list, blank=True)

    linkedin_url = models.URLField(blank=True)

    # Internal only. Never serialised to a candidate-facing endpoint — see
    # the note on recompute_lead_score below.
    lead_score = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["target_role"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"

    def recompute_lead_score(self) -> int:
        """Signals of a genuinely active job seeker.

        Deliberately not exposed to candidates: it is an internal triage aid,
        and showing someone a number that ranks them would change how they
        behave without helping them. Weights are the ones agreed in the
        architecture proposal.
        """
        score = 0
        if self.assessments.exists():
            score += 20
        if self.resumes.filter(parse_status__in=["pending", "parsed"]).exists():
            score += 20
        if self.target_role:
            score += 10
        if self.work_mode or self.preferred_locations:
            score += 10
        if self.saved_jobs.exists():
            score += 10
        if self.applications.exists():
            score += 10
        # Interview prep and consultation land in later phases; their 10 and
        # 20 stay unclaimed until the features that earn them exist.
        self.lead_score = min(score, 100)
        self.save(update_fields=["lead_score", "updated_at"])
        return self.lead_score


class Assessment(models.Model):
    """A completed readiness assessment.

    `method` records how the score was produced, so a row scored by today's
    rules stays interpretable after the algorithm changes. Without it, old
    scores silently become uncomparable.
    """

    class Method(models.TextChoices):
        SELF_REPORT_V1 = "self_report_v1", "Self-reported answers, v1 rules"

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="assessments"
    )
    answers = models.JSONField(default=dict)

    overall = models.PositiveSmallIntegerField()
    resume_score = models.PositiveSmallIntegerField()
    targeting_score = models.PositiveSmallIntegerField()
    ats_score = models.PositiveSmallIntegerField()
    interview_score = models.PositiveSmallIntegerField()

    method = models.CharField(
        max_length=32, choices=Method.choices, default=Method.SELF_REPORT_V1
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.candidate.email} — {self.overall}/100"


class Resume(models.Model):
    """Metadata only.

    The file lives in private object storage; this table never holds its
    contents. `storage_key` is an internal path, not a URL — there is no
    public URL for a resume, by design.
    """

    class ParseStatus(models.TextChoices):
        PENDING = "pending", "Awaiting parse"
        PARSED = "parsed", "Parsed"
        FAILED = "failed", "Parse failed"
        SKIPPED = "skipped", "Not parsed"

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="resumes"
    )
    storage_key = models.CharField(max_length=400, unique=True)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    size_bytes = models.PositiveIntegerField()
    sha256 = models.CharField(max_length=64, blank=True)

    parse_status = models.CharField(
        max_length=12, choices=ParseStatus.choices, default=ParseStatus.PENDING
    )
    parse_error = models.TextField(blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.candidate.email})"


class ResumeExtraction(models.Model):
    """Staging for parsed fields.

    Nothing here reaches the Candidate row until `confirmed_by_user` is true.
    Parsing is imperfect, and silently overwriting somebody's own account of
    their career with a regex's opinion of it is not acceptable.
    """

    resume = models.ForeignKey(
        Resume, on_delete=models.CASCADE, related_name="extractions"
    )
    field = models.CharField(max_length=60)
    extracted_value = models.JSONField()
    confidence = models.FloatField(default=0.0)
    confirmed_by_user = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["field"]
        constraints = [
            models.UniqueConstraint(
                fields=["resume", "field"], name="unique_extraction_per_field"
            )
        ]

    def __str__(self) -> str:
        return f"{self.field} ← {self.resume_id}"


class SavedJob(models.Model):
    """Saving is not applying. Kept in its own table so the two can never be
    confused by a query."""

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="saved_jobs"
    )
    job = models.ForeignKey(
        "jobs.Job", on_delete=models.CASCADE, related_name="saved_by"
    )
    note = models.TextField(blank=True)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-saved_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"], name="unique_saved_job_per_candidate"
            )
        ]

    def __str__(self) -> str:
        return f"{self.candidate.email} ♥ {self.job_id}"


class Application(models.Model):
    """A candidate's application record.

    STARTED and APPLIED are separate on purpose. Every application is
    submitted on the employer's own site, so this platform never observes a
    submission — it only observes a click. Only the candidate may set
    APPLIED; nothing in the codebase should ever set it automatically.
    """

    class Status(models.TextChoices):
        SAVED = "saved", "Saved"
        STARTED = "started", "Application started"
        APPLIED = "applied", "Marked as applied"
        RECRUITER_SCREEN = "recruiter_screen", "Recruiter screen"
        TECHNICAL = "technical", "Technical"
        MANAGER = "manager", "Manager"
        OFFER = "offer", "Offer"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"
        ACCEPTED = "accepted", "Accepted"

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="applications"
    )
    job = models.ForeignKey(
        "jobs.Job", on_delete=models.CASCADE, related_name="applications"
    )

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.STARTED
    )
    started_at = models.DateTimeField(default=timezone.now)
    applied_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Set only when the candidate confirms they applied.",
    )
    interview_at = models.DateTimeField(null=True, blank=True)
    next_action = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"], name="unique_application_per_candidate"
            )
        ]

    def __str__(self) -> str:
        return f"{self.candidate.email} → {self.job_id} ({self.status})"

    def mark_applied(self) -> None:
        """The only supported route to APPLIED. Call this from a candidate
        action, never from an automated process."""
        self.status = self.Status.APPLIED
        self.applied_at = self.applied_at or timezone.now()
        self.save(update_fields=["status", "applied_at", "updated_at"])
