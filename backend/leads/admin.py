from django.contrib import admin
from django.utils.html import format_html

from .models import Consultation, ContactMessage, Document, Lead


class ConsultationInline(admin.TabularInline):
    model = Consultation
    extra = 0
    fields = ["scheduled_for", "status", "meeting_url", "notes"]


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    fields = ["kind", "external_url", "original_name", "uploaded_at"]
    readonly_fields = ["uploaded_at"]


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    """This is the CRM. Do not build a custom one until the volume justifies it."""

    list_display = [
        "full_name",
        "email",
        "work_authorization",
        "status_badge",
        "created_at",
    ]
    list_filter = ["status", "work_authorization", "created_at"]
    search_fields = ["full_name", "email", "phone", "target_roles", "message"]
    date_hierarchy = "created_at"
    list_per_page = 50
    inlines = [ConsultationInline, DocumentInline]
    readonly_fields = [
        "created_at",
        "updated_at",
        "source_path",
        "referrer",
        "user_agent",
        "ip_address",
    ]
    fieldsets = [
        (
            "Candidate",
            {
                "fields": [
                    "full_name",
                    "email",
                    "phone",
                    "work_authorization",
                    "linkedin_url",
                    "target_roles",
                    "message",
                ]
            },
        ),
        ("Pipeline", {"fields": ["status", "notes"]}),
        (
            "Provenance",
            {
                "classes": ["collapse"],
                "fields": [
                    "source_path",
                    "referrer",
                    "user_agent",
                    "ip_address",
                    "created_at",
                    "updated_at",
                ],
            },
        ),
    ]
    actions = ["mark_contacted", "mark_spam"]

    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        colors = {
            "new": "#6C3CE1",
            "contacted": "#9A5B06",
            "call_booked": "#0E7F58",
            "engaged": "#0E7F58",
            "declined": "#8C86A3",
            "spam": "#B01F52",
        }
        return format_html(
            '<span style="background:{}1A;color:{};padding:2px 8px;'
            'border-radius:6px;font-size:11px;font-weight:600;">{}</span>',
            colors.get(obj.status, "#8C86A3"),
            colors.get(obj.status, "#8C86A3"),
            obj.get_status_display(),
        )

    @admin.action(description="Mark selected as contacted")
    def mark_contacted(self, request, queryset):
        updated = queryset.update(status="contacted")
        self.message_user(request, f"{updated} lead(s) marked as contacted.")

    @admin.action(description="Mark selected as spam")
    def mark_spam(self, request, queryset):
        updated = queryset.update(status="spam")
        self.message_user(request, f"{updated} lead(s) marked as spam.")


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ["lead", "scheduled_for", "status", "created_at"]
    list_filter = ["status", "scheduled_for"]
    search_fields = ["lead__full_name", "lead__email"]
    autocomplete_fields = ["lead"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "handled", "created_at"]
    list_filter = ["handled", "created_at"]
    search_fields = ["name", "email", "message"]
    readonly_fields = ["ip_address", "created_at"]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["lead", "kind", "original_name", "uploaded_at"]
    list_filter = ["kind"]
    search_fields = ["lead__full_name", "lead__email", "original_name"]
    autocomplete_fields = ["lead"]
