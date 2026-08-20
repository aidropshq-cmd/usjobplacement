from django.db import models


class WorkAuthorization(models.TextChoices):
    """Mirrors `workAuthorizations` in the frontend's src/lib/site.ts.

    If you add a status there, add it here — the serializer validates against
    these values and an unknown one is rejected rather than silently stored.
    """

    F1 = "f1", "F1 student"
    OPT = "opt", "Post-completion OPT"
    STEM_OPT = "stem-opt", "STEM OPT extension"
    H1B = "h1b", "H-1B"
    GREEN_CARD = "gc", "Green card holder"
    CITIZEN = "citizen", "US citizen"
    OTHER = "other", "Other / not sure"


class LeadStatus(models.TextChoices):
    NEW = "new", "New"
    CONTACTED = "contacted", "Contacted"
    CALL_BOOKED = "call_booked", "Demo call booked"
    ENGAGED = "engaged", "Engaged"
    DECLINED = "declined", "Declined"
    SPAM = "spam", "Spam"


class Lead(models.Model):
    """Someone who asked us to get in touch.

    The Django admin is the CRM for now — see leads/admin.py. Do not build a
    custom admin UI before there are enough leads to justify one.
    """

    full_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True)
    work_authorization = models.CharField(
        max_length=16,
        choices=WorkAuthorization.choices,
        default=WorkAuthorization.OTHER,
    )
    target_roles = models.TextField(blank=True)
    linkedin_url = models.URLField(blank=True)
    message = models.TextField(blank=True)

    status = models.CharField(
        max_length=16, choices=LeadStatus.choices, default=LeadStatus.NEW
    )
    notes = models.TextField(blank=True, help_text="Internal only. Never shown to the candidate.")

    # Provenance — useful when you start paying for traffic.
    source_path = models.CharField(max_length=200, blank=True)
    referrer = models.CharField(max_length=500, blank=True)
    user_agent = models.CharField(max_length=400, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} <{self.email}>"


class ContactMessage(models.Model):
    """A plain message from /contact. Separate from Lead on purpose — not
    everyone who writes in is a candidate, and mixing them pollutes the CRM."""

    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    handled = models.BooleanField(default=False)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} <{self.email}>"


class Consultation(models.Model):
    """A booked demo call. Populated by hand today; phase 03's Calendly
    webhook will create these automatically once scheduling is live."""

    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        SCHEDULED = "scheduled", "Scheduled"
        COMPLETED = "completed", "Completed"
        NO_SHOW = "no_show", "No show"
        CANCELLED = "cancelled", "Cancelled"

    lead = models.ForeignKey(
        Lead, on_delete=models.CASCADE, related_name="consultations"
    )
    scheduled_for = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=16, choices=Status.choices, default=Status.REQUESTED
    )
    meeting_url = models.URLField(blank=True)
    external_event_id = models.CharField(
        max_length=200, blank=True, help_text="Calendly event id, once wired."
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_for", "-created_at"]

    def __str__(self) -> str:
        return f"{self.lead.full_name} — {self.get_status_display()}"


class Document(models.Model):
    """A candidate document — resume, transcript, offer letter.

    File storage is NOT configured yet: Render's disk is ephemeral, so a file
    written there disappears on the next deploy. Until an S3 or R2 bucket
    exists, `file` stays unused and `external_url` holds a link the candidate
    sent us. The upload endpoint returns 503 while storage is unconfigured
    rather than accepting a file it would silently lose.
    """

    class Kind(models.TextChoices):
        RESUME = "resume", "Resume"
        TRANSCRIPT = "transcript", "Transcript"
        OFFER = "offer", "Offer letter"
        OTHER = "other", "Other"

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="documents")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.RESUME)
    file = models.FileField(upload_to="documents/", blank=True)
    external_url = models.URLField(blank=True)
    original_name = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return f"{self.get_kind_display()} — {self.lead.full_name}"
