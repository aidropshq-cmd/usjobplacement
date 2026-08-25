"""Resume upload lifecycle.

Every endpoint resolves a candidate from a scoped access token before it
touches anything. No endpoint takes a candidate id and trusts it — that would
let anyone enumerate other people's resumes.
"""

import logging
import os

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import storage
from .models import CandidateAccessToken, Resume

logger = logging.getLogger(__name__)

MAX_FILENAME = 255


def _candidate_from_request(request):
    """Bearer token, or the same value in the body for simple clients."""
    header = request.headers.get("Authorization", "")
    raw = header[7:].strip() if header.lower().startswith("bearer ") else ""
    if not raw:
        raw = str(request.data.get("candidate_token", "") or "")
    return CandidateAccessToken.resolve(raw)


def _unauthorized():
    """One response for every failure mode.

    Identical whether the token is absent, expired, revoked, or valid but for
    a different candidate. A distinct message per case would let a caller
    probe which candidate and resume ids exist.
    """
    return Response(
        {"detail": "Not authorized for this resume."},
        status=status.HTTP_403_FORBIDDEN,
    )


def _extension_of(filename: str) -> str:
    return os.path.splitext(filename)[1].lower().lstrip(".")


@api_view(["POST"])
def create_upload_intent(request):
    """POST /api/documents/

    Validates, reserves an object key, returns a short-lived presigned PUT.
    The Resume row is created PENDING: a URL is permission to upload, never
    evidence that one happened.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    filename = str(request.data.get("filename", "") or "").strip()
    content_type = str(request.data.get("content_type", "") or "").strip()
    try:
        size = int(request.data.get("size_bytes") or 0)
    except (TypeError, ValueError):
        size = 0

    if not filename:
        return Response({"detail": "Choose a file first."}, status=400)
    if len(filename) > MAX_FILENAME:
        return Response({"detail": "That filename is too long."}, status=400)

    extension = _extension_of(filename)
    allowed = storage.ALLOWED_TYPES.get(extension)
    if not allowed:
        return Response({"detail": "Upload a PDF or DOCX file."}, status=400)

    allowed_types, _magic = allowed
    if content_type and content_type not in allowed_types:
        return Response(
            {"detail": f"That file does not look like a {extension.upper()}."},
            status=400,
        )

    if size <= 0:
        return Response({"detail": "That file appears to be empty."}, status=400)
    if size > settings.RESUME_MAX_BYTES:
        mb = settings.RESUME_MAX_BYTES // (1024 * 1024)
        return Response(
            {"detail": f"That file is over {mb} MB. Try a smaller one."}, status=400
        )

    if not storage.is_configured():
        # Not switched on is a different thing from broken, and says so.
        return Response(
            {"detail": "Resume storage is not configured yet."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    key = storage.build_object_key(candidate.id, extension)
    try:
        upload_url, ttl = storage.create_upload_url(key, allowed_types[0])
    except storage.StorageError:
        return Response(
            {"detail": "Could not start the upload. Try again in a moment."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    resume = Resume.objects.create(
        candidate=candidate,
        storage_key=key,
        original_filename=filename[:MAX_FILENAME],
        content_type=allowed_types[0],
        size_bytes=size,
        upload_status=Resume.UploadStatus.PENDING,
    )

    return Response(
        {
            "resume_id": resume.id,
            "upload_url": upload_url,
            "expires_in": ttl,
            "upload_status": resume.upload_status,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def confirm_upload(request, resume_id: int):
    """POST /api/documents/<id>/confirm

    The only path to UPLOADED. Confirms the object exists, then checks the
    bytes really are what the extension claimed.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    try:
        resume = Resume.objects.get(pk=resume_id, candidate=candidate)
    except Resume.DoesNotExist:
        return _unauthorized()

    if resume.upload_status == Resume.UploadStatus.DELETED:
        return Response({"detail": "That resume was deleted."}, status=410)

    try:
        meta = storage.head(resume.storage_key)
    except storage.StorageError:
        return Response(
            {"detail": "Could not verify the upload. Try again in a moment."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if meta is None:
        resume.upload_status = Resume.UploadStatus.FAILED
        resume.upload_error = "No object found in storage after upload."
        resume.save(update_fields=["upload_status", "upload_error", "updated_at"])
        return Response(
            {
                "detail": "We did not receive the file. Please try uploading again.",
                "upload_status": resume.upload_status,
                "retryable": True,
            },
            status=400,
        )

    prefix = storage.read_prefix(resume.storage_key)
    extension = _extension_of(resume.original_filename)
    if not storage.content_matches_extension(extension, prefix):
        # Extension and MIME are both client-supplied. This is the first point
        # where the actual bytes can be inspected, so a mismatch is removed
        # rather than kept.
        resume.upload_status = Resume.UploadStatus.FAILED
        resume.upload_error = "File contents did not match the extension."
        resume.save(update_fields=["upload_status", "upload_error", "updated_at"])
        try:
            storage.delete(resume.storage_key)
        except storage.StorageError:
            logger.exception("Could not remove rejected upload %s", resume.storage_key)
        return Response(
            {
                "detail": "That file is not a valid PDF or DOCX.",
                "upload_status": resume.upload_status,
                "retryable": True,
            },
            status=400,
        )

    actual = int(meta.get("ContentLength") or 0)
    if actual > settings.RESUME_MAX_BYTES:
        resume.upload_status = Resume.UploadStatus.FAILED
        resume.upload_error = "Uploaded file exceeded the size limit."
        resume.save(update_fields=["upload_status", "upload_error", "updated_at"])
        try:
            storage.delete(resume.storage_key)
        except storage.StorageError:
            logger.exception("Could not remove oversized upload")
        mb = settings.RESUME_MAX_BYTES // (1024 * 1024)
        return Response({"detail": f"That file is over {mb} MB."}, status=400)

    resume.size_bytes = actual or resume.size_bytes
    resume.upload_status = Resume.UploadStatus.UPLOADED
    resume.upload_error = ""
    resume.confirmed_at = timezone.now()
    resume.save(
        update_fields=[
            "size_bytes",
            "upload_status",
            "upload_error",
            "confirmed_at",
            "updated_at",
        ]
    )
    candidate.recompute_lead_score()

    return Response(
        {
            "resume_id": resume.id,
            "upload_status": resume.upload_status,
            "size_bytes": resume.size_bytes,
            "original_filename": resume.original_filename,
        }
    )


@api_view(["GET"])
def download_url(request, resume_id: int):
    """GET /api/documents/<id>/download — short-lived signed URL, owner only."""
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    try:
        resume = Resume.objects.get(pk=resume_id, candidate=candidate)
    except Resume.DoesNotExist:
        return _unauthorized()

    if resume.upload_status != Resume.UploadStatus.UPLOADED:
        return Response(
            {"detail": "That resume has not finished uploading."}, status=409
        )

    try:
        url, ttl = storage.create_download_url(resume.storage_key)
    except storage.StorageNotConfigured:
        return Response({"detail": "Resume storage is not configured yet."}, status=503)
    except storage.StorageError:
        return Response({"detail": "Could not produce a download link."}, status=502)

    return Response({"url": url, "expires_in": ttl})


@api_view(["DELETE"])
def delete_resume(request, resume_id: int):
    """DELETE /api/documents/<id>

    Removes the object first and verifies it is gone. The row is marked
    DELETED only once storage confirms — dropping the metadata while the file
    survives would be the worst possible outcome of a deletion request.
    """
    candidate = _candidate_from_request(request)
    if candidate is None:
        return _unauthorized()

    try:
        resume = Resume.objects.get(pk=resume_id, candidate=candidate)
    except Resume.DoesNotExist:
        return _unauthorized()

    if resume.upload_status == Resume.UploadStatus.DELETED:
        return Response({"detail": "Already deleted."}, status=200)

    try:
        gone = storage.delete(resume.storage_key)
    except storage.StorageError:
        return Response(
            {
                "detail": "Could not delete the file. Nothing was removed — try again.",
                "retryable": True,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if not gone:
        # Storage accepted the call but the object is still there. Reporting
        # success now would be a claim the candidate cannot check.
        return Response(
            {
                "detail": "The file could not be confirmed as deleted. Try again.",
                "retryable": True,
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    resume.upload_status = Resume.UploadStatus.DELETED
    resume.deleted_at = timezone.now()
    resume.save(update_fields=["upload_status", "deleted_at", "updated_at"])
    candidate.recompute_lead_score()

    return Response({"resume_id": resume.id, "upload_status": resume.upload_status})
