import logging

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from leads.models import Lead
from leads.notifications import notify_new_lead
from leads.views import client_ip

from .models import Assessment, Candidate
from .serializers import AssessmentIntakeSerializer, AssessmentResultSerializer

logger = logging.getLogger(__name__)


def _split_locations(raw: str) -> list[str]:
    return [part.strip() for part in raw.split(",") if part.strip()][:10]


@api_view(["POST"])
@transaction.atomic
def create_assessment(request):
    """POST /api/assessments/

    Upserts a Candidate by email and records the Assessment, then creates the
    Lead as before so the existing CRM view and the notification emails keep
    working exactly as they did. Nothing about the old path regresses.
    """
    serializer = AssessmentIntakeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    candidate, created = Candidate.objects.get_or_create(
        email=data["email"].lower(),
        defaults={"full_name": data["full_name"]},
    )

    # Only fill blanks or refresh with a non-empty answer — a returning
    # candidate who skips a question must not have their earlier answer wiped.
    for field in ("full_name", "target_role", "experience_level", "work_mode"):
        value = data.get(field) or ""
        if value:
            setattr(candidate, field, value)
    if data.get("work_status_pref"):
        candidate.work_status_pref = data["work_status_pref"]
    locations = _split_locations(data.get("preferred_locations", ""))
    if locations:
        candidate.preferred_locations = locations
    candidate.save()

    assessment = Assessment.objects.create(
        candidate=candidate,
        answers=data.get("answers") or {},
        overall=data["overall"],
        resume_score=data["resume_score"],
        targeting_score=data["targeting_score"],
        ats_score=data["ats_score"],
        interview_score=data["interview_score"],
    )
    candidate.recompute_lead_score()

    lead = Lead.objects.create(
        full_name=candidate.full_name,
        email=candidate.email,
        work_authorization=candidate.work_status_pref or "other",
        target_roles=candidate.target_role,
        message=(
            f"Readiness assessment — {assessment.overall}/100 "
            f"(estimated from answers).\n"
            f"Resume {assessment.resume_score} · Targeting {assessment.targeting_score} "
            f"· ATS {assessment.ats_score} · Interview {assessment.interview_score}"
        ),
        source_path=str(request.data.get("source_path", ""))[:200],
        referrer=request.META.get("HTTP_REFERER", "")[:500],
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:400],
        ip_address=client_ip(request),
    )

    # Same contract as the lead endpoint: a notification failure must never
    # cost us the record that is already committed.
    try:
        notify_new_lead(lead)
    except Exception:
        logger.exception("Notification failed for assessment lead id=%s", lead.pk)

    return Response(
        {
            "candidate_created": created,
            "assessment": AssessmentResultSerializer(assessment).data,
        },
        status=status.HTTP_201_CREATED,
    )
