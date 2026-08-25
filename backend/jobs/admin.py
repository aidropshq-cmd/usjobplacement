from django.contrib import admin

from .models import EmployerSource, Job, JobMatch


@admin.register(EmployerSource)
class EmployerSourceAdmin(admin.ModelAdmin):
    """The curated employer list. This IS the job coverage — ATS boards are
    per-employer, so adding a row here is how the catalogue grows."""

    list_display = ["employer_name", "provider", "board_token", "is_active",
                    "last_job_count", "last_ingested_at", "last_ingest_status"]
    list_filter = ["provider", "is_active"]
    search_fields = ["employer_name", "board_token"]
    readonly_fields = ["last_ingested_at", "last_ingest_status", "last_job_count",
                       "created_at"]


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ["title", "company", "location", "role_family", "remote_type",
                    "experience_level", "sponsorship_status", "posted_at", "is_active"]
    list_filter = ["role_family", "remote_type", "experience_level",
                   "sponsorship_status", "is_active", "source"]
    search_fields = ["title", "company", "location"]
    date_hierarchy = "posted_at"
    # Sponsorship must only ever be set from explicit wording found by the
    # classifier, with the sentence kept alongside it as evidence.
    readonly_fields = ["source", "source_job_id", "first_seen_at", "last_seen_at",
                       "sponsorship_evidence"]


@admin.register(JobMatch)
class JobMatchAdmin(admin.ModelAdmin):
    list_display = ["candidate", "job", "score", "experience_match", "location_match",
                    "computed_at"]
    list_filter = ["experience_match", "location_match"]
    search_fields = ["candidate__email", "job__title"]
