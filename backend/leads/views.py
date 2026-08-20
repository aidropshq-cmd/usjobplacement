import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from .models import ContactMessage, Lead
from .notifications import notify_contact_message, notify_new_lead
from .serializers import ContactMessageSerializer, LeadSerializer

logger = logging.getLogger(__name__)


def client_ip(request) -> str | None:
    """Behind Render's proxy the real client is first in X-Forwarded-For."""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class LeadCreateView(CreateAPIView):
    """POST /api/leads/ — the site's only write path from a public form."""

    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

    def perform_create(self, serializer):
        request = self.request
        lead = serializer.save(
            source_path=request.data.get("source_path", "")[:200],
            referrer=request.META.get("HTTP_REFERER", "")[:500],
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
            ip_address=client_ip(request),
        )
        # Notifications must never fail the request: the lead is already saved,
        # and losing it because an email provider hiccuped would be the worst
        # possible trade.
        try:
            notify_new_lead(lead)
        except Exception:
            logger.exception("Notification failed for lead id=%s", lead.pk)


class ContactMessageCreateView(CreateAPIView):
    """POST /api/contact/ — plain messages, kept out of the lead CRM."""

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def perform_create(self, serializer):
        message = serializer.save(ip_address=client_ip(self.request))
        try:
            notify_contact_message(message)
        except Exception:
            logger.exception("Notification failed for contact id=%s", message.pk)


@api_view(["GET"])
def health(request):
    """Render pings this. Also the fastest way to tell whether the service is
    awake — a free-tier instance sleeps after inactivity and the first request
    back pays a cold start."""
    return Response(
        {
            "status": "ok",
            "email": bool(settings.RESEND_API_KEY),
            "whatsapp": settings.WHATSAPP_ENABLED,
            "uploads": False,  # no object storage configured yet
        }
    )


@api_view(["POST"])
def upload_document(request):
    """Deliberately unavailable.

    Render's filesystem is ephemeral, so a file accepted here would be lost on
    the next deploy. Returning 503 is honest; accepting the upload and quietly
    dropping the file would not be. Wire django-storages to S3 or R2, then
    implement this.
    """
    return Response(
        {
            "detail": (
                "File uploads are not enabled yet. Email your resume to "
                f"{settings.EMAIL_REPLY_TO} and we will attach it to your record."
            )
        },
        status=status.HTTP_503_SERVICE_UNAVAILABLE,
    )
