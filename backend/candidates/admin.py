from django.contrib import admin

from .models import Application, Assessment, Candidate, Resume, ResumeExtraction, SavedJob


class AssessmentInline(admin.TabularInline):
    model = Assessment
    extra = 0
    readonly_fields = ["overall", "resume_score", "targeting_score", "ats_score",
                       "interview_score", "method", "created_at"]
    can_delete = False


class ResumeInline(admin.TabularInline):
    model = Resume
    extra = 0
    # storage_key is an internal path, never a URL. Read-only so nobody can
    # repoint a resume record at another candidate's file by editing a form.
    readonly_fields = ["storage_key", "original_filename", "content_type",
                       "size_bytes", "sha256", "uploaded_at"]


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "target_role", "experience_level",
                    "work_status_pref", "lead_score", "created_at"]
    list_filter = ["work_status_pref", "experience_level", "work_mode", "created_at"]
    search_fields = ["full_name", "email", "target_role"]
    date_hierarchy = "created_at"
    readonly_fields = ["lead_score", "created_at", "updated_at"]
    inlines = [AssessmentInline, ResumeInline]
    actions = ["recompute_lead_scores"]

    @admin.action(description="Recompute lead score")
    def recompute_lead_scores(self, request, queryset):
        for candidate in queryset:
            candidate.recompute_lead_score()
        self.message_user(request, f"Recomputed {queryset.count()} score(s).")


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ["candidate", "overall", "resume_score", "targeting_score",
                    "ats_score", "interview_score", "method", "created_at"]
    list_filter = ["method", "created_at"]
    search_fields = ["candidate__email", "candidate__full_name"]
    autocomplete_fields = ["candidate"]


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ["original_filename", "candidate", "size_bytes", "parse_status",
                    "uploaded_at"]
    list_filter = ["parse_status", "content_type"]
    search_fields = ["candidate__email", "original_filename"]


@admin.register(ResumeExtraction)
class ResumeExtractionAdmin(admin.ModelAdmin):
    list_display = ["resume", "field", "confidence", "confirmed_by_user"]
    list_filter = ["field", "confirmed_by_user"]


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ["candidate", "job", "status", "applied_at", "next_action",
                    "updated_at"]
    list_filter = ["status", "applied_at"]
    search_fields = ["candidate__email", "job__title", "job__company"]


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ["candidate", "job", "saved_at"]
    search_fields = ["candidate__email", "job__title"]
