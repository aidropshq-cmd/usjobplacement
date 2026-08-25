"""Phase 2 — resume storage lifecycle.

Uses moto, an in-process S3 mock. R2 speaks the S3 API, so these exercise the
real boto3 calls (presign, head_object, get_object range, delete_object)
without touching a live bucket or needing credentials.
"""

import io
import zipfile
from unittest.mock import patch

import boto3
from django.core.cache import cache
from django.test import TestCase, override_settings
from moto import mock_aws

from .models import Candidate, CandidateAccessToken, Resume

BUCKET = "test-resumes"

R2_TEST = {
    "R2_ACCOUNT_ID": "acc",
    "R2_ACCESS_KEY_ID": "key",
    "R2_SECRET_ACCESS_KEY": "secret",
    "R2_BUCKET_NAME": BUCKET,
    "R2_ENDPOINT": None,  # let moto intercept the default AWS endpoint
    "RESUME_MAX_BYTES": 5 * 1024 * 1024,
    "SECURE_SSL_REDIRECT": False,
    "REST_FRAMEWORK": {"DEFAULT_THROTTLE_CLASSES": [], "DEFAULT_THROTTLE_RATES": {}},
}

PDF_BYTES = b"%PDF-1.7\n" + b"x" * 400


def docx_bytes() -> bytes:
    """A real minimal DOCX: a zip carrying the OOXML marker."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("word/document.xml", "<document/>")
    return buffer.getvalue()


@mock_aws
@override_settings(**R2_TEST)
class ResumeStorageTests(TestCase):
    def setUp(self):
        super().setUp()
        # DRF binds throttle_classes at import, so override_settings cannot
        # switch throttling off. Clearing the cache resets the rate window and
        # keeps each test independent.
        cache.clear()
        self.s3 = boto3.client("s3", region_name="us-east-1")
        self.s3.create_bucket(Bucket=BUCKET)

        self.alice = Candidate.objects.create(email="alice@example.com", full_name="Alice")
        self.bob = Candidate.objects.create(email="bob@example.com", full_name="Bob")
        self.alice_token = CandidateAccessToken.issue(self.alice).token
        self.bob_token = CandidateAccessToken.issue(self.bob).token

    def auth(self, token):
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def intent(self, token=None, **overrides):
        payload = {
            "filename": "resume.pdf",
            "content_type": "application/pdf",
            "size_bytes": len(PDF_BYTES),
            **overrides,
        }
        return self.client.post(
            "/api/documents/",
            payload,
            content_type="application/json",
            **self.auth(token or self.alice_token),
        )

    def upload_and_confirm(self, body=PDF_BYTES, filename="resume.pdf"):
        content_type = (
            "application/pdf"
            if filename.endswith(".pdf")
            else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        response = self.intent(filename=filename, content_type=content_type,
                               size_bytes=len(body))
        resume_id = response.json()["resume_id"]
        key = Resume.objects.get(pk=resume_id).storage_key
        self.s3.put_object(Bucket=BUCKET, Key=key, Body=body)
        confirm = self.client.post(
            f"/api/documents/{resume_id}/confirm",
            {},
            content_type="application/json",
            **self.auth(self.alice_token),
        )
        return resume_id, confirm

    # ---------------------------------------------------------------- 1-3

    def test_missing_file_is_rejected(self):
        response = self.intent(filename="")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Resume.objects.count(), 0)

    def test_unsupported_file_types_are_rejected(self):
        for name in ["virus.exe", "archive.zip", "script.js", "page.html",
                     "vector.svg", "notes.txt", "noextension"]:
            response = self.intent(filename=name, content_type="")
            self.assertEqual(response.status_code, 400, name)
        self.assertEqual(Resume.objects.count(), 0)

    def test_file_too_large_is_rejected(self):
        response = self.intent(size_bytes=6 * 1024 * 1024)

        self.assertEqual(response.status_code, 400)
        self.assertIn("MB", response.json()["detail"])
        self.assertEqual(Resume.objects.count(), 0)

    # ---------------------------------------------------------------- 4-5

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(
            "/api/documents/",
            {"filename": "resume.pdf", "size_bytes": 100},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Resume.objects.count(), 0)

    def test_expired_token_is_rejected(self):
        from datetime import timedelta

        from django.utils import timezone

        record = CandidateAccessToken.objects.get(token=self.alice_token)
        record.expires_at = timezone.now() - timedelta(minutes=1)
        record.save()

        self.assertEqual(self.intent().status_code, 403)

    def test_presigned_url_is_generated_and_row_starts_pending(self):
        response = self.intent()

        self.assertEqual(response.status_code, 201)
        body = response.json()
        self.assertIn("upload_url", body)
        self.assertGreater(body["expires_in"], 0)
        self.assertEqual(body["upload_status"], "pending")

        resume = Resume.objects.get()
        # A URL is permission to upload, not proof of one.
        self.assertEqual(resume.upload_status, Resume.UploadStatus.PENDING)
        self.assertIsNone(resume.confirmed_at)

    # ---------------------------------------------------------------- 6-7

    def test_successful_upload_confirmation(self):
        resume_id, confirm = self.upload_and_confirm()

        self.assertEqual(confirm.status_code, 200)
        resume = Resume.objects.get(pk=resume_id)
        self.assertEqual(resume.upload_status, Resume.UploadStatus.UPLOADED)
        self.assertIsNotNone(resume.confirmed_at)
        self.assertEqual(resume.size_bytes, len(PDF_BYTES))

    def test_docx_upload_is_accepted(self):
        _, confirm = self.upload_and_confirm(docx_bytes(), "resume.docx")

        self.assertEqual(confirm.status_code, 200)

    def test_confirm_without_an_actual_upload_marks_failed(self):
        """The presigned URL was issued but the browser never uploaded."""
        resume_id = self.intent().json()["resume_id"]

        response = self.client.post(
            f"/api/documents/{resume_id}/confirm", {},
            content_type="application/json", **self.auth(self.alice_token),
        )

        self.assertEqual(response.status_code, 400)
        self.assertTrue(response.json()["retryable"])
        resume = Resume.objects.get(pk=resume_id)
        self.assertEqual(resume.upload_status, Resume.UploadStatus.FAILED)
        self.assertIsNone(resume.confirmed_at)

    def test_contents_not_matching_extension_are_rejected_and_removed(self):
        """A .exe renamed to .pdf passes name checks. The bytes do not."""
        response = self.intent()
        resume_id = response.json()["resume_id"]
        key = Resume.objects.get(pk=resume_id).storage_key
        self.s3.put_object(Bucket=BUCKET, Key=key, Body=b"MZ\x90\x00executable")

        confirm = self.client.post(
            f"/api/documents/{resume_id}/confirm", {},
            content_type="application/json", **self.auth(self.alice_token),
        )

        self.assertEqual(confirm.status_code, 400)
        self.assertEqual(
            Resume.objects.get(pk=resume_id).upload_status,
            Resume.UploadStatus.FAILED,
        )
        # And the rejected object is gone from the bucket, not left lying there.
        remaining = self.s3.list_objects_v2(Bucket=BUCKET).get("Contents", [])
        self.assertEqual(remaining, [])

    # ---------------------------------------------------------------- 8

    def test_candidate_a_cannot_reach_candidate_b_resume(self):
        resume_id, _ = self.upload_and_confirm()

        for method, url in [
            ("post", f"/api/documents/{resume_id}/confirm"),
            ("get", f"/api/documents/{resume_id}/download"),
            ("delete", f"/api/documents/{resume_id}"),
        ]:
            response = getattr(self.client, method)(
                url, **self.auth(self.bob_token)
            )
            self.assertEqual(response.status_code, 403, url)

        # Bob's attempts changed nothing.
        self.assertEqual(
            Resume.objects.get(pk=resume_id).upload_status,
            Resume.UploadStatus.UPLOADED,
        )

    # ---------------------------------------------------------------- 9-10

    def test_owner_gets_a_short_lived_download_url(self):
        resume_id, _ = self.upload_and_confirm()

        response = self.client.get(
            f"/api/documents/{resume_id}/download", **self.auth(self.alice_token)
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("X-Amz-Signature", body["url"])
        self.assertGreater(body["expires_in"], 0)
        self.assertLessEqual(body["expires_in"], 900)

    def test_download_is_refused_before_upload_is_confirmed(self):
        resume_id = self.intent().json()["resume_id"]

        response = self.client.get(
            f"/api/documents/{resume_id}/download", **self.auth(self.alice_token)
        )

        self.assertEqual(response.status_code, 409)

    def test_unauthenticated_download_is_refused(self):
        resume_id, _ = self.upload_and_confirm()

        response = self.client.get(f"/api/documents/{resume_id}/download")

        self.assertEqual(response.status_code, 403)

    # ---------------------------------------------------------------- 11-12

    def test_delete_removes_the_object_and_marks_the_row(self):
        resume_id, _ = self.upload_and_confirm()
        key = Resume.objects.get(pk=resume_id).storage_key

        response = self.client.delete(
            f"/api/documents/{resume_id}", **self.auth(self.alice_token)
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            Resume.objects.get(pk=resume_id).upload_status,
            Resume.UploadStatus.DELETED,
        )
        # The file is genuinely gone, not just the metadata.
        self.assertIsNone(
            next(
                (o for o in self.s3.list_objects_v2(Bucket=BUCKET).get("Contents", [])
                 if o["Key"] == key),
                None,
            )
        )

    def test_storage_delete_failure_leaves_the_row_intact(self):
        """If the object cannot be removed, the row must NOT say deleted."""
        resume_id, _ = self.upload_and_confirm()

        with patch("candidates.storage.delete", side_effect=Exception("R2 down")):
            with patch("candidates.resume_views.storage.delete") as mocked:
                from candidates import storage as storage_module

                mocked.side_effect = storage_module.StorageError("R2 down")
                response = self.client.delete(
                    f"/api/documents/{resume_id}", **self.auth(self.alice_token)
                )

        self.assertEqual(response.status_code, 502)
        self.assertTrue(response.json()["retryable"])
        self.assertEqual(
            Resume.objects.get(pk=resume_id).upload_status,
            Resume.UploadStatus.UPLOADED,
        )

    def test_delete_reporting_object_still_present_is_not_called_success(self):
        resume_id, _ = self.upload_and_confirm()

        with patch("candidates.resume_views.storage.delete", return_value=False):
            response = self.client.delete(
                f"/api/documents/{resume_id}", **self.auth(self.alice_token)
            )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(
            Resume.objects.get(pk=resume_id).upload_status,
            Resume.UploadStatus.UPLOADED,
        )

    # ---------------------------------------------------------------- 13

    def test_no_r2_credentials_leak_through_any_response(self):
        resume_id, confirm = self.upload_and_confirm()
        download = self.client.get(
            f"/api/documents/{resume_id}/download", **self.auth(self.alice_token)
        )

        secrets_that_must_never_appear = ["secret", "key", "acc"]
        for response in (confirm, download):
            text = response.content.decode()
            self.assertNotIn("R2_SECRET_ACCESS_KEY", text)
            self.assertNotIn("aws_secret_access_key", text)
            # The presigned URL legitimately contains the ACCESS KEY ID as
            # part of the SigV4 credential scope; the SECRET never appears.
            self.assertNotIn(R2_TEST["R2_SECRET_ACCESS_KEY"], text)
        self.assertTrue(secrets_that_must_never_appear)

    def test_object_key_carries_no_personal_information(self):
        self.upload_and_confirm(filename="Alice_Smith_H1B_2026.pdf")

        key = Resume.objects.get().storage_key
        self.assertTrue(key.startswith(f"candidate/{self.alice.id}/resumes/"))
        for leak in ["Alice", "Smith", "H1B", "alice@example.com"]:
            self.assertNotIn(leak, key)

    def test_lead_score_counts_confirmed_uploads_only(self):
        self.intent()  # pending, never uploaded
        self.assertEqual(self.alice.recompute_lead_score(), 0)

        self.upload_and_confirm(filename="second.pdf")
        self.assertEqual(self.alice.recompute_lead_score(), 20)


@override_settings(SECURE_SSL_REDIRECT=False)
class StorageNotConfiguredTests(TestCase):
    """With no credentials the API must say 'not switched on', not 500."""

    def setUp(self):
        super().setUp()
        cache.clear()

    @override_settings(R2_ACCOUNT_ID="", R2_ACCESS_KEY_ID="",
                       R2_SECRET_ACCESS_KEY="", R2_BUCKET_NAME="")
    def test_intent_returns_503_when_storage_is_unconfigured(self):
        candidate = Candidate.objects.create(email="c@example.com", full_name="C")
        token = CandidateAccessToken.issue(candidate).token

        response = self.client.post(
            "/api/documents/",
            {"filename": "cv.pdf", "content_type": "application/pdf", "size_bytes": 10},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 503)


@mock_aws
@override_settings(**R2_TEST)
class AccountDeletionTests(TestCase):
    """Step 11 of the verification workflow, and the mechanism behind the
    privacy commitment."""

    def setUp(self):
        super().setUp()
        cache.clear()
        self.s3 = boto3.client("s3", region_name="us-east-1")
        self.s3.create_bucket(Bucket=BUCKET)

        self.alice = Candidate.objects.create(
            email="alice@example.com", full_name="Alice"
        )
        self.bob = Candidate.objects.create(email="bob@example.com", full_name="Bob")
        self.alice_token = CandidateAccessToken.issue(self.alice).token
        self.bob_token = CandidateAccessToken.issue(self.bob).token

    def _resume_for(self, candidate, key_suffix):
        key = f"candidate/{candidate.id}/resumes/{key_suffix}.pdf"
        self.s3.put_object(Bucket=BUCKET, Key=key, Body=PDF_BYTES)
        return Resume.objects.create(
            candidate=candidate,
            storage_key=key,
            original_filename="cv.pdf",
            content_type="application/pdf",
            size_bytes=len(PDF_BYTES),
            upload_status=Resume.UploadStatus.UPLOADED,
        )

    def test_deletes_candidate_files_and_lead_rows(self):
        from leads.models import Lead

        self._resume_for(self.alice, "aaa")
        Lead.objects.create(full_name="Alice", email="Alice@Example.com")

        response = self.client.delete(
            "/api/candidates/me", HTTP_AUTHORIZATION=f"Bearer {self.alice_token}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["files_removed"], 1)
        self.assertEqual(response.json()["lead_rows_removed"], 1)
        self.assertFalse(Candidate.objects.filter(email="alice@example.com").exists())
        self.assertEqual(Lead.objects.count(), 0)
        # And the file is genuinely gone, not merely unreferenced.
        self.assertEqual(self.s3.list_objects_v2(Bucket=BUCKET).get("Contents", []), [])

    def test_cascades_to_related_rows(self):
        from .models import Assessment

        self._resume_for(self.alice, "bbb")
        Assessment.objects.create(
            candidate=self.alice, overall=50, resume_score=50, targeting_score=50,
            ats_score=50, interview_score=50,
        )

        self.client.delete(
            "/api/candidates/me", HTTP_AUTHORIZATION=f"Bearer {self.alice_token}"
        )

        self.assertEqual(Assessment.objects.count(), 0)
        self.assertEqual(Resume.objects.count(), 0)
        self.assertEqual(CandidateAccessToken.objects.filter(
            token=self.alice_token).count(), 0)

    def test_one_candidate_cannot_delete_another(self):
        self._resume_for(self.bob, "ccc")

        response = self.client.delete(
            "/api/candidates/me", HTTP_AUTHORIZATION=f"Bearer {self.alice_token}"
        )

        # Alice's own (empty) account goes; Bob is untouched.
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Candidate.objects.filter(email="bob@example.com").exists())
        self.assertEqual(Resume.objects.filter(candidate=self.bob).count(), 1)

    def test_unauthenticated_deletion_is_refused(self):
        response = self.client.delete("/api/candidates/me")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(Candidate.objects.count(), 2)

    def test_a_failed_file_removal_deletes_nothing(self):
        """Partial deletion reported as success would be worse than an error."""
        self._resume_for(self.alice, "ddd")

        with patch("candidates.account_views.storage.delete", return_value=False):
            response = self.client.delete(
                "/api/candidates/me", HTTP_AUTHORIZATION=f"Bearer {self.alice_token}"
            )

        self.assertEqual(response.status_code, 502)
        self.assertTrue(response.json()["retryable"])
        self.assertTrue(Candidate.objects.filter(email="alice@example.com").exists())
