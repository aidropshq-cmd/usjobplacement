"""Private object storage for resumes.

Design rules, all of them load-bearing:

  * The resume file never passes through Django. The browser PUTs it straight
    to R2 with a short-lived presigned URL, so neither Render nor Vercel ever
    holds the bytes. That removes a class of leak and keeps us inside the free
    tier's memory limits.
  * No URL to a resume is ever permanent or public. Every download URL is
    presigned and expires in minutes.
  * A presigned URL is permission to upload, not proof that an upload
    happened. Nothing is marked UPLOADED until `head_object` confirms the
    object actually exists.

R2 speaks the S3 API, so this is plain boto3. Moving to S3 later is a change
of endpoint and nothing else.
"""

from __future__ import annotations

import logging
import uuid

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


class StorageNotConfigured(RuntimeError):
    """Raised when R2 credentials are absent.

    Surfaced to the caller as a 503 rather than a 500: the service is not
    broken, it is not switched on, and the difference matters when someone is
    trying to work out why an upload failed.
    """


class StorageError(RuntimeError):
    """R2 reachable but the operation failed."""


# Extension -> (allowed content types, magic-byte prefix)
ALLOWED_TYPES: dict[str, tuple[tuple[str, ...], bytes]] = {
    "pdf": (("application/pdf",), b"%PDF-"),
    "docx": (
        (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
        b"PK\x03\x04",
    ),
}


def is_configured() -> bool:
    return bool(
        settings.R2_ACCOUNT_ID
        and settings.R2_ACCESS_KEY_ID
        and settings.R2_SECRET_ACCESS_KEY
        and settings.R2_BUCKET_NAME
    )


def _client():
    if not is_configured():
        raise StorageNotConfigured("R2 credentials are not configured.")
    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",
        # SigV4 is what R2 expects; virtual-host addressing is not supported.
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )


def build_object_key(candidate_id: int, extension: str) -> str:
    """`candidate/<id>/resumes/<random>.<ext>`

    Never the original filename. People name resumes things like
    "Priya_Raman_H1B_2026.pdf", and an object key is one misconfiguration away
    from being visible — so it carries an opaque id and nothing about the
    person.
    """
    return f"candidate/{candidate_id}/resumes/{uuid.uuid4().hex}.{extension}"


def create_upload_url(key: str, content_type: str) -> tuple[str, int]:
    """Presigned PUT. Returns (url, seconds_valid)."""
    ttl = settings.R2_UPLOAD_URL_TTL
    try:
        url = _client().generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.R2_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=ttl,
        )
    except (BotoCoreError, ClientError) as exc:
        logger.exception("Presigned upload URL failed for key=%s", key)
        raise StorageError(str(exc)) from exc
    return url, ttl


def create_download_url(key: str) -> tuple[str, int]:
    """Presigned GET, minutes not hours. Callers must check ownership first."""
    ttl = settings.R2_DOWNLOAD_URL_TTL
    try:
        url = _client().generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key},
            ExpiresIn=ttl,
        )
    except (BotoCoreError, ClientError) as exc:
        logger.exception("Presigned download URL failed for key=%s", key)
        raise StorageError(str(exc)) from exc
    return url, ttl


def head(key: str) -> dict | None:
    """Object metadata, or None if it is not there.

    This is what turns "we issued a URL" into "a file exists", and it is the
    only thing allowed to move a Resume to UPLOADED.
    """
    try:
        return _client().head_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in {"404", "NoSuchKey", "NotFound"}:
            return None
        logger.exception("head_object failed for key=%s", key)
        raise StorageError(str(exc)) from exc
    except BotoCoreError as exc:
        raise StorageError(str(exc)) from exc


def read_prefix(key: str, length: int = 4096) -> bytes:
    """First bytes of the object, for content sniffing.

    A ranged GET, not a full download — enough to check the file really is
    what its extension claims without ever pulling a whole resume into memory.
    """
    try:
        response = _client().get_object(
            Bucket=settings.R2_BUCKET_NAME, Key=key, Range=f"bytes=0-{length - 1}"
        )
        return response["Body"].read()
    except (BotoCoreError, ClientError) as exc:
        logger.warning("Range read failed for key=%s: %s", key, exc)
        return b""


def read_all(key: str) -> bytes:
    """Whole object, for parsing.

    Only ever called on a file we already accepted, and only for a resume
    capped at RESUME_MAX_BYTES — so this cannot pull something unbounded into
    memory on a small instance.
    """
    try:
        response = _client().get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
        return response["Body"].read()
    except (BotoCoreError, ClientError) as exc:
        logger.exception("Full read failed for key=%s", key)
        raise StorageError(str(exc)) from exc


def content_matches_extension(extension: str, prefix: bytes) -> bool:
    """Magic-byte check.

    MIME type is client-supplied and trivially spoofed, so the extension is
    verified against what the bytes actually start with.

    Honest limitation: DOCX is a ZIP, so this cannot distinguish a real DOCX
    from a renamed .zip on the first four bytes alone. We additionally look
    for an OOXML marker in the first few KB, which a plain archive will not
    have. It is a strong signal, not a guarantee, and nothing downstream
    treats it as one.
    """
    allowed = ALLOWED_TYPES.get(extension)
    if not allowed or not prefix:
        return False

    _, magic = allowed
    if not prefix.startswith(magic):
        return False

    if extension == "docx":
        return b"[Content_Types].xml" in prefix or b"word/" in prefix
    return True


def delete(key: str) -> bool:
    """Delete then verify.

    Returns True only when the object is confirmed gone. Deleting the database
    row while the file survives in the bucket would be the worst possible
    outcome of a deletion request, so the check is not optional.
    """
    client = _client()
    try:
        client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    except (BotoCoreError, ClientError) as exc:
        logger.exception("delete_object failed for key=%s", key)
        raise StorageError(str(exc)) from exc

    return head(key) is None
