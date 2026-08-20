"""Outbound notifications.

Two channels behind one interface. Email works today via Resend. WhatsApp is
wired but disabled: business-initiated WhatsApp messages need a Meta Business
Account, a verified sender number and pre-approved message templates, none of
which can be provisioned from code. Set WHATSAPP_ENABLED once those exist and
this starts sending with no code change.

Every send is best-effort and never raises into the request path — a lead that
was written to the database is captured, even if the notification fails. The
failure is logged loudly so it can be noticed and replayed.
"""

from __future__ import annotations

import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TIMEOUT = 10


# ---------------------------------------------------------------- email


def send_email(
    *, to: list[str], subject: str, text: str, reply_to: str | None = None
) -> bool:
    """Send through Resend. Returns True if accepted.

    With no API key configured we log the message instead of sending. That is
    deliberate: local development should never quietly depend on a live
    outbound service, and a missing key should be obvious rather than silent.
    """
    if not to:
        return False

    if not settings.RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY not set — email NOT sent. to=%s subject=%r", to, subject
        )
        return False

    payload = {
        "from": settings.EMAIL_FROM,
        "to": to,
        "subject": subject,
        "text": text,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
            timeout=TIMEOUT,
        )
    except requests.RequestException:
        logger.exception("Resend request failed. to=%s subject=%r", to, subject)
        return False

    if response.status_code >= 400:
        logger.error(
            "Resend rejected the email. status=%s body=%s",
            response.status_code,
            response.text[:500],
        )
        return False

    logger.info("Email sent. to=%s subject=%r", to, subject)
    return True


# ---------------------------------------------------------------- whatsapp


def send_whatsapp(*, to: str, template: str, variables: list[str]) -> bool:
    """Send a templated WhatsApp message.

    Only templates already approved by the provider can be sent to someone who
    has not messaged us first — that is a WhatsApp platform rule, not a choice
    we make here. `variables` fill the template's numbered placeholders.
    """
    if not settings.WHATSAPP_ENABLED:
        logger.debug("WhatsApp disabled — skipping message to %s", to)
        return False

    if settings.WHATSAPP_PROVIDER != "meta":
        logger.error(
            "Unsupported WHATSAPP_PROVIDER=%r. Only 'meta' is implemented; add a "
            "Twilio branch here if you switch.",
            settings.WHATSAPP_PROVIDER,
        )
        return False

    if not (settings.WHATSAPP_PHONE_NUMBER_ID and settings.WHATSAPP_ACCESS_TOKEN):
        logger.error("WhatsApp enabled but phone number id or access token is missing.")
        return False

    if not template:
        logger.error("WhatsApp enabled but no template name configured.")
        return False

    url = (
        f"https://graph.facebook.com/v21.0/"
        f"{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "template",
        "template": {
            "name": template,
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": value} for value in variables
                    ],
                }
            ],
        },
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
            timeout=TIMEOUT,
        )
    except requests.RequestException:
        logger.exception("WhatsApp request failed. to=%s", to)
        return False

    if response.status_code >= 400:
        logger.error(
            "WhatsApp rejected the message. status=%s body=%s",
            response.status_code,
            response.text[:500],
        )
        return False

    logger.info("WhatsApp sent. to=%s template=%s", to, template)
    return True


# ---------------------------------------------------------------- composed


def notify_new_lead(lead) -> None:
    """Confirmation to the candidate, notification to the team.

    Copy here follows the site's standing rule: we prepare candidates for
    interviews and are never on the call. Do not soften that in an email.
    """
    send_email(
        to=[lead.email],
        subject="We got your details — ZapKitt US Job Placement",
        reply_to=settings.EMAIL_REPLY_TO,
        text=(
            f"Hi {lead.full_name.split(' ')[0]},\n\n"
            "Thanks for getting in touch. We have your details and someone will "
            "reply within one business day to arrange your free demo call.\n\n"
            "On that call we walk through the eight stages of the process "
            "against your actual profile, tell you honestly whether it is "
            "ready, and quote the engagement before you commit to anything. "
            "There is no charge for the call.\n\n"
            "One thing worth saying plainly, because this industry is not "
            "always clear about it: we coach you before every interview round "
            "and debrief with you afterwards. We are never on the call itself.\n\n"
            f"— ZapKitt US Job Placement\n{settings.SITE_URL}\n"
        ),
    )

    send_email(
        to=settings.NOTIFY_TEAM_EMAILS,
        subject=f"New lead: {lead.full_name} ({lead.get_work_authorization_display()})",
        reply_to=lead.email,
        text=(
            f"Name:      {lead.full_name}\n"
            f"Email:     {lead.email}\n"
            f"Phone:     {lead.phone or '—'}\n"
            f"Status:    {lead.get_work_authorization_display()}\n"
            f"LinkedIn:  {lead.linkedin_url or '—'}\n"
            f"Roles:     {lead.target_roles or '—'}\n\n"
            f"Message:\n{lead.message or '—'}\n\n"
            f"Source:    {lead.source_path or '—'}\n"
            f"Referrer:  {lead.referrer or '—'}\n"
            f"Lead id:   {lead.pk}\n"
        ),
    )

    for number in settings.NOTIFY_TEAM_WHATSAPP:
        send_whatsapp(
            to=number,
            template=settings.WHATSAPP_TEMPLATE_LEAD,
            variables=[
                lead.full_name,
                lead.get_work_authorization_display(),
                lead.email,
            ],
        )


def notify_contact_message(message) -> None:
    send_email(
        to=settings.NOTIFY_TEAM_EMAILS,
        subject=f"Contact form: {message.name}",
        reply_to=message.email,
        text=(
            f"From:  {message.name} <{message.email}>\n\n"
            f"{message.message}\n"
        ),
    )
