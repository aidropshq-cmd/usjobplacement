"""Candidate self-deletion.

Exists for two reasons. It closes step 11 of the verification workflow, so a
production check cleans up after itself instead of leaving rows behind. And
it is the mechanism a real candidate needs to have their data removed on
request — the Phase 13 privacy commitment needs an actual button behind it,
not a promise in a paragraph.

Authorized by the same scoped CandidateAccessToken as the resume endpoints.
Nothing here touches the R2 upload/confirm/download implementation.
"""

import logging

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from leads.models import Lead

from . import storage
from .models import Resume
from .resume_views import _candidate_from_request, _unauthorized

logger = logging.getLogger(__name__)


@api_view(["DELETE"])
def delete_me(request):
    """DELETE /api/candidates/me

    Removes stored files first, then the database rows. Doing it in that
    order matters: dropping the candidate first would orphan every resume in
    the bucket with nothing left pointing at it, so the files would survive
    a deletion request forever with no way to find them again.

    If a file cannot be removed, the whole request fails and nothing is
    deleted. A partial deletion that reports success would be worse than an
    error the caller can retry.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    live = candidate.resumes.exclude(upload_status=Resume.UploadStatus.DELETED)
    removed, failed = 0, []

    for resume in live:
        try:
            if storage.is_configured() and storage.delete(resume.storage_key):
                removed += 1
            elif storage.is_configured():
                failed.append(resume.storage_key)
        except storage.StorageError:
            logger.exception("Could not delete %s during account removal",
                             resume.storage_key)
            failed.append(resume.storage_key)

    if failed:
        return Response(
            {
                "detail": "Some files could not be removed. Nothing was deleted.",
                "retryable": True,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    email = candidate.email
    with transaction.atomic():
        # Leads are matched by email because they predate the Candidate table.
        leads_removed, _ = Lead.objects.filter(email__iexact=email).delete()
        # Cascades to assessments, resumes, extractions, saved jobs,
        # applications, matches and access tokens.
        candidate.delete()

    logger.info("Deleted candidate %s (%s files, %s lead rows)", email, removed,
                leads_removed)
    return Response(
        {"deleted": True, "files_removed": removed, "lead_rows_removed": leads_removed}
    )
