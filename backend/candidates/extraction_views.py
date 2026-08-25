"""Review and apply parsed resume fields.

The safety property of this whole phase lives here: extraction is a
suggestion until the candidate says otherwise. `apply` writes only the fields
explicitly listed in the request, using the value the candidate submits — so
a correction wins over the parser, and an unmentioned field is left alone.

Nothing calls apply automatically.
"""

import logging

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import parsing, storage
from .models import Resume, ResumeExtraction
from .resume_views import _candidate_from_request, _unauthorized

logger = logging.getLogger(__name__)

# Fields the candidate is allowed to push onto their own profile. Anything
# outside this set is ignored, so a crafted request cannot reach lead_score
# or another candidate's data.
APPLICABLE = {
    "full_name": "full_name",
    "phone": "phone",
    "skills": "skills",
    "years_experience": "experience_level",
    "job_titles": "target_role",
}


def run_parse(resume: Resume) -> None:
    """Parse and stage. Never raises into a request.

    Called after an upload is confirmed. A parse failure must not undo a
    successful upload — the file is safely stored either way, and the
    candidate can still fill their profile in by hand.
    """
    try:
        data = storage.read_all(resume.storage_key)
        found = parsing.parse_resume(data, resume.content_type)
    except (storage.StorageError, parsing.ParseError) as exc:
        resume.parse_status = Resume.ParseStatus.FAILED
        resume.parse_error = str(exc)[:500]
        resume.save(update_fields=["parse_status", "parse_error", "updated_at"])
        logger.info("Parse failed for resume %s: %s", resume.pk, exc)
        return
    except Exception as exc:  # noqa: BLE001 - never let parsing break an upload
        resume.parse_status = Resume.ParseStatus.FAILED
        resume.parse_error = f"Unexpected parse error: {exc}"[:500]
        resume.save(update_fields=["parse_status", "parse_error", "updated_at"])
        logger.exception("Unexpected parse failure for resume %s", resume.pk)
        return

    with transaction.atomic():
        ResumeExtraction.objects.filter(resume=resume).delete()
        ResumeExtraction.objects.bulk_create(
            [
                ResumeExtraction(
                    resume=resume,
                    field=field,
                    extracted_value=value,
                    confidence=confidence,
                    confirmed_by_user=False,
                )
                for field, (value, confidence) in found.items()
            ]
        )
        resume.parse_status = Resume.ParseStatus.PARSED
        resume.parse_error = ""
        resume.save(update_fields=["parse_status", "parse_error", "updated_at"])


@api_view(["GET"])
def list_extractions(request, resume_id: int):
    """GET /api/documents/<id>/extractions

    What the parser thinks it found, with a confidence per field and the
    candidate's current profile value beside it, so a correction is a
    comparison rather than a guess.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    try:
        resume = Resume.objects.get(pk=resume_id, candidate=candidate)
    except Resume.DoesNotExist:
        return _unauthorized()

    current = {
        "full_name": candidate.full_name,
        "phone": candidate.phone,
        "skills": candidate.skills,
        "years_experience": candidate.experience_level,
        "job_titles": candidate.target_role,
    }

    return Response(
        {
            "parse_status": resume.parse_status,
            "parse_error": resume.parse_error,
            "extractions": [
                {
                    "field": item.field,
                    "value": item.extracted_value,
                    "confidence": round(item.confidence, 2),
                    "applicable": item.field in APPLICABLE,
                    "current_value": current.get(item.field),
                    "confirmed": item.confirmed_by_user,
                }
                for item in resume.extractions.all()
            ],
        }
    )


@api_view(["POST"])
def apply_extractions(request, resume_id: int):
    """POST /api/documents/<id>/extractions/apply

    Body: {"fields": {"skills": [...], "phone": "+1..."}}

    Only the fields named here are written, and the value written is the one
    in the request — not the parser's. That is what makes a correction stick
    and what stops an unreviewed guess reaching the profile.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    try:
        resume = Resume.objects.get(pk=resume_id, candidate=candidate)
    except Resume.DoesNotExist:
        return _unauthorized()

    submitted = request.data.get("fields")
    if not isinstance(submitted, dict) or not submitted:
        return Response(
            {"detail": "Send a fields object with what you want to apply."},
            status=400,
        )

    applied, ignored = {}, []
    for field, value in submitted.items():
        target = APPLICABLE.get(field)
        if not target:
            ignored.append(field)
            continue

        if field == "skills":
            if not isinstance(value, list):
                ignored.append(field)
                continue
            candidate.skills = [str(v).strip()[:60] for v in value if str(v).strip()][:60]
        elif field == "years_experience":
            try:
                candidate.experience_level = parsing.experience_band(float(value))
            except (TypeError, ValueError):
                ignored.append(field)
                continue
        elif field == "job_titles":
            # A list of detected titles collapses to one target role; the
            # candidate picks which, so we take the first they send.
            first = value[0] if isinstance(value, list) and value else value
            if not str(first).strip():
                ignored.append(field)
                continue
            candidate.target_role = str(first).strip()[:120]
        else:
            if not str(value).strip():
                ignored.append(field)
                continue
            setattr(candidate, target, str(value).strip()[:120])

        applied[field] = getattr(candidate, target)

    if not applied:
        return Response(
            {"detail": "Nothing was applied.", "ignored": ignored}, status=400
        )

    candidate.save()
    ResumeExtraction.objects.filter(resume=resume, field__in=applied.keys()).update(
        confirmed_by_user=True
    )
    candidate.recompute_lead_score()

    return Response({"applied": applied, "ignored": ignored})
