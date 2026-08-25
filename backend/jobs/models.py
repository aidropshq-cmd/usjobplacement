"""Job data model.

Everything here describes jobs published by employers on their own applicant
tracking systems. Two rules run through the whole file:

  1. Sponsorship is recorded only when the posting states it. There is no
     inference from company size, industry or reputation, and NOT_STATED is
     never rewritten into either a yes or a no.
  2. Nothing is invented. A field we cannot fill from the source stays empty
     or UNKNOWN, and the interface says so rather than guessing.
"""

from django.db import models
from django.utils import timezone


class EmployerSource(models.Model):
    """A configurable employer feed.

    ATS boards are per-employer — there is no cross-employer search — so the
    curated list of these rows IS the job coverage. Kept in the database
    rather than a code constant so the list can be extended without a deploy.
    """

    class Provider(models.TextChoices):
        GREENHOUSE = "greenhouse", "Greenhouse"
        LEVER = "lever", "Lever"
        ASHBY = "ashby", "Ashby"

    provider = models.CharField(max_length=16, choices=Provider.choices)
    board_token = models.CharField(
        max_length=120,
        help_text="The employer's board slug, e.g. the 'stripe' in "
        "boards-api.greenhouse.io/v1/boards/stripe/jobs",
    )
    employer_name = models.CharField(max_length=160)
    is_active = models.BooleanField(default=True)

    last_ingested_at = models.DateTimeField(null=True, blank=True)
    last_ingest_status = models.CharField(max_length=200, blank=True)
    last_job_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["employer_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "board_token"], name="unique_board_per_provider"
            )
        ]

    def __str__(self) -> str:
        return f"{self.employer_name} ({self.provider})"


class RemoteType(models.TextChoices):
    REMOTE = "remote", "Remote"
    HYBRID = "hybrid", "Hybrid"
    ONSITE = "onsite", "On-site"
    UNKNOWN = "unknown", "Unknown"


class ExperienceLevel(models.TextChoices):
    ENTRY = "entry", "Entry"
    MID = "mid", "Mid"
    SENIOR = "senior", "Senior"
    UNKNOWN = "unknown", "Unknown"


class SponsorshipStatus(models.TextChoices):
    """Three values, and there will never be a fourth.

    Measured against 200 real postings, only ~1.5% mention sponsorship at
    all — so NOT_STATED is the normal case, not an edge case. Any code that
    treats it as rare, or collapses it toward either answer, is wrong.
    """

    EXPLICIT_OFFERED = "explicit_offered", "Posting states sponsorship is available"
    EXPLICIT_NOT_OFFERED = (
        "explicit_not_offered",
        "Posting states sponsorship is not available",
    )
    NOT_STATED = "not_stated", "Posting does not say"


class RoleFamily(models.TextChoices):
    SOFTWARE = "software", "Software Engineer"
    DEVOPS = "devops", "DevOps Engineer"
    CLOUD = "cloud", "Cloud Engineer"
    DATA_ENG = "data_engineer", "Data Engineer"
    DATA_SCI = "data_scientist", "Data Scientist"
    SALESFORCE = "salesforce", "Salesforce Developer"
    QA = "qa", "QA Engineer"
    SECURITY = "security", "Cybersecurity Engineer"
    BUSINESS_ANALYST = "business_analyst", "Business Analyst"
    PRODUCT = "product", "Product Manager"
    OTHER_IT = "other_it", "Other IT"
    NON_IT = "non_it", "Not IT"
    UNKNOWN = "unknown", "Unclassified"


class Job(models.Model):
    """A normalized posting.

    Unique on (source, source_job_id) so re-ingesting a board updates rows
    instead of duplicating them.
    """

    source = models.CharField(max_length=16, choices=EmployerSource.Provider.choices)
    source_job_id = models.CharField(max_length=120)
    employer_source = models.ForeignKey(
        EmployerSource,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="jobs",
    )

    title = models.CharField(max_length=300)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)

    remote_type = models.CharField(
        max_length=8, choices=RemoteType.choices, default=RemoteType.UNKNOWN
    )
    employment_type = models.CharField(max_length=40, blank=True)
    role_family = models.CharField(
        max_length=20, choices=RoleFamily.choices, default=RoleFamily.UNKNOWN
    )
    experience_level = models.CharField(
        max_length=8, choices=ExperienceLevel.choices, default=ExperienceLevel.UNKNOWN
    )
    skills = models.JSONField(default=list, blank=True)

    sponsorship_status = models.CharField(
        max_length=24,
        choices=SponsorshipStatus.choices,
        default=SponsorshipStatus.NOT_STATED,
        help_text="Set from explicit wording in the posting only. Never inferred.",
    )
    sponsorship_evidence = models.TextField(
        blank=True,
        help_text="The sentence the status was read from, so any claim is auditable.",
    )

    application_url = models.URLField(max_length=600)
    source_url = models.URLField(max_length=600, blank=True)

    posted_at = models.DateTimeField(null=True, blank=True)
    first_seen_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-posted_at", "-first_seen_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["source", "source_job_id"], name="unique_job_per_source"
            )
        ]
        indexes = [
            models.Index(fields=["role_family", "-posted_at"]),
            models.Index(fields=["is_active", "-last_seen_at"]),
            models.Index(fields=["sponsorship_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} — {self.company}"

    @property
    def is_stale(self) -> bool:
        """True once past the agreed 60-day retention window.

        Retention keeps Neon inside its 0.5 GB free tier — descriptions run
        about 5 KB each, so unbounded ingestion fills the database. A posting
        this old is also noise: it has almost certainly been filled or pulled.
        """
        age = timezone.now() - (self.posted_at or self.first_seen_at)
        return age.days > RETENTION_DAYS


RETENTION_DAYS = 60


class JobMatch(models.Model):
    """A cached, explainable match between a candidate and a job.

    The explanation is the product. A bare percentage is a horoscope; the
    matching and missing skills are what someone can act on.
    """

    candidate = models.ForeignKey(
        "candidates.Candidate", on_delete=models.CASCADE, related_name="matches"
    )
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="matches")

    score = models.PositiveSmallIntegerField()
    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    experience_match = models.BooleanField(default=False)
    location_match = models.BooleanField(default=False)
    explanation = models.JSONField(default=dict, blank=True)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-score"]
        constraints = [
            models.UniqueConstraint(
                fields=["candidate", "job"], name="unique_match_per_candidate_job"
            )
        ]
        indexes = [models.Index(fields=["candidate", "-score"])]

    def __str__(self) -> str:
        return f"{self.candidate_id} × {self.job_id} = {self.score}%"
