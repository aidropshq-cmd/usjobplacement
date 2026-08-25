"""Phase 3 — resume parsing and the confirm-before-apply rule."""

import io
import zipfile

import boto3
from django.core.cache import cache
from django.test import TestCase, override_settings
from moto import mock_aws

from . import parsing
from .models import Candidate, CandidateAccessToken, Resume, ResumeExtraction
from .test_resume_storage import BUCKET, R2_TEST

RESUME_TEXT = """Priya Raman
priya.raman@example.com | (415) 555-0142 | Austin, TX

SUMMARY
Senior DevOps Engineer with 7 years of experience building platforms on AWS.

EXPERIENCE
DevOps Engineer, 2019 - Present
Built CI/CD with Jenkins and GitHub Actions. Managed Kubernetes and Docker.
Wrote Terraform for EC2, S3 and Lambda. Monitoring with Prometheus and Grafana.

Software Engineer, 2017 - 2019
Python and PostgreSQL services. Django REST APIs. Some React on the frontend.

EDUCATION
Master of Science, Computer Science

CERTIFICATIONS
AWS Certified Solutions Architect
Certified Kubernetes Administrator
"""


def make_pdf(text: str) -> bytes:
    """A minimal single-page PDF with a real text layer pypdf can read."""
    escaped = text.replace("\\", "").replace("(", "").replace(")", "")
    lines = [line for line in escaped.splitlines() if line.strip()]
    content = "BT /F1 10 Tf 12 TL 40 750 Td\n"
    for line in lines:
        content += f"({line[:90]}) Tj T*\n"
    content += "ET"
    stream = content.encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream
        + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{index} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_at = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n"
        f"{xref_at}\n%%EOF"
    ).encode()
    return bytes(out)


def make_docx(text: str) -> bytes:
    import docx

    document = docx.Document()
    for line in text.splitlines():
        document.add_paragraph(line)
    buffer = io.BytesIO()
    document.save(buffer)
    return buffer.getvalue()


class ParserTests(TestCase):
    """The parser on its own, no HTTP involved."""

    def setUp(self):
        self.found = parsing.parse_resume(make_pdf(RESUME_TEXT), "application/pdf")

    def test_extracts_email_and_phone_with_high_confidence(self):
        self.assertEqual(self.found["email"][0], "priya.raman@example.com")
        self.assertGreaterEqual(self.found["email"][1], 0.9)
        self.assertEqual(self.found["phone"][0], "+14155550142")

    def test_extracts_technologies_from_the_vocabulary(self):
        skills = self.found["skills"][0]
        for expected in ["AWS", "Docker", "Kubernetes", "Terraform", "Jenkins",
                         "Python", "PostgreSQL", "Django", "React"]:
            self.assertIn(expected, skills)

    def test_does_not_invent_technologies_that_are_absent(self):
        skills = self.found["skills"][0]
        for absent in ["Azure", "Salesforce", "PyTorch", "Cassandra"]:
            self.assertNotIn(absent, skills)

    def test_prefers_a_stated_year_count_over_summing_ranges(self):
        # "7 years of experience" is stated outright, and summing the two
        # date ranges would give a different number.
        self.assertEqual(self.found["years_experience"][0], 7.0)

    def test_extracts_education_and_certifications(self):
        self.assertIn("Master", self.found["education"][0])
        self.assertIn(
            "AWS Certified Solutions Architect", self.found["certifications"][0]
        )

    def test_low_confidence_fields_are_marked_low(self):
        """Name and job titles are heuristics, and say so."""
        self.assertLessEqual(self.found["full_name"][1], 0.5)
        self.assertLessEqual(self.found["job_titles"][1], 0.5)

    def test_docx_is_parsed_the_same_way(self):
        docx_found = parsing.parse_resume(
            make_docx(RESUME_TEXT),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        self.assertEqual(docx_found["email"][0], "priya.raman@example.com")
        self.assertIn("Kubernetes", docx_found["skills"][0])

    def test_a_file_with_no_text_layer_fails_clearly(self):
        """A scanned resume is an image. That must be an explicit failure, not
        an empty profile presented as a successful parse."""
        empty = make_pdf("")

        with self.assertRaises(parsing.ParseError) as caught:
            parsing.parse_resume(empty, "application/pdf")

        self.assertIn("No text", str(caught.exception))

    def test_corrupt_file_raises_parse_error(self):
        with self.assertRaises(parsing.ParseError):
            parsing.parse_resume(b"not a pdf at all", "application/pdf")

    def test_absent_fields_are_absent_not_blank(self):
        minimal = parsing.parse_resume(
            make_pdf("Just some words with no contact details"), "application/pdf"
        )

        self.assertNotIn("email", minimal)
        self.assertNotIn("phone", minimal)

    def test_experience_bands(self):
        self.assertEqual(parsing.experience_band(1), "0-2")
        self.assertEqual(parsing.experience_band(4), "3-5")
        self.assertEqual(parsing.experience_band(7), "6-10")
        self.assertEqual(parsing.experience_band(15), "10+")


@mock_aws
@override_settings(**R2_TEST)
class ExtractionFlowTests(TestCase):
    """Parsing through the API, and the confirm-before-apply rule."""

    def setUp(self):
        super().setUp()
        cache.clear()
        self.s3 = boto3.client("s3", region_name="us-east-1")
        self.s3.create_bucket(Bucket=BUCKET)

        self.candidate = Candidate.objects.create(
            email="priya@example.com", full_name="Priya R", target_role="Data Engineer"
        )
        self.token = CandidateAccessToken.issue(self.candidate).token
        self.other = Candidate.objects.create(email="bob@example.com", full_name="Bob")
        self.other_token = CandidateAccessToken.issue(self.other).token

    def auth(self, token=None):
        return {"HTTP_AUTHORIZATION": f"Bearer {token or self.token}"}

    def upload(self, body=None):
        body = body or make_pdf(RESUME_TEXT)
        intent = self.client.post(
            "/api/documents/",
            {
                "filename": "cv.pdf",
                "content_type": "application/pdf",
                "size_bytes": len(body),
            },
            content_type="application/json",
            **self.auth(),
        )
        resume_id = intent.json()["resume_id"]
        self.s3.put_object(
            Bucket=BUCKET, Key=Resume.objects.get(pk=resume_id).storage_key, Body=body
        )
        confirm = self.client.post(
            f"/api/documents/{resume_id}/confirm", {},
            content_type="application/json", **self.auth(),
        )
        return resume_id, confirm

    def test_confirming_an_upload_parses_it(self):
        resume_id, confirm = self.upload()

        self.assertEqual(confirm.json()["parse_status"], "parsed")
        self.assertGreater(ResumeExtraction.objects.filter(resume_id=resume_id).count(), 4)

    def test_parsing_never_touches_the_profile_on_its_own(self):
        """The safety property of the whole phase."""
        before_name = self.candidate.full_name
        before_role = self.candidate.target_role
        before_skills = list(self.candidate.skills)

        self.upload()

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.full_name, before_name)
        self.assertEqual(self.candidate.target_role, before_role)
        self.assertEqual(self.candidate.skills, before_skills)
        self.assertFalse(
            ResumeExtraction.objects.filter(confirmed_by_user=True).exists()
        )

    def test_review_shows_findings_beside_current_values(self):
        resume_id, _ = self.upload()

        response = self.client.get(
            f"/api/documents/{resume_id}/extractions", **self.auth()
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["parse_status"], "parsed")
        by_field = {item["field"]: item for item in body["extractions"]}
        self.assertIn("skills", by_field)
        # The candidate's existing role is shown so a change is a comparison.
        self.assertEqual(by_field["job_titles"]["current_value"], "Data Engineer")

    def test_apply_writes_only_the_fields_sent(self):
        resume_id, _ = self.upload()

        response = self.client.post(
            f"/api/documents/{resume_id}/extractions/apply",
            {"fields": {"skills": ["AWS", "Terraform"]}},
            content_type="application/json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, 200)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.skills, ["AWS", "Terraform"])
        # Untouched, because it was not sent.
        self.assertEqual(self.candidate.target_role, "Data Engineer")

    def test_a_candidate_correction_beats_the_parser(self):
        """The value written is the one submitted, not the extracted one."""
        resume_id, _ = self.upload()
        parsed_name = ResumeExtraction.objects.get(
            resume_id=resume_id, field="full_name"
        ).extracted_value

        self.client.post(
            f"/api/documents/{resume_id}/extractions/apply",
            {"fields": {"full_name": "Priya Raman-Corrected"}},
            content_type="application/json",
            **self.auth(),
        )

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.full_name, "Priya Raman-Corrected")
        self.assertNotEqual(self.candidate.full_name, parsed_name)

    def test_applying_marks_only_those_fields_confirmed(self):
        resume_id, _ = self.upload()

        self.client.post(
            f"/api/documents/{resume_id}/extractions/apply",
            {"fields": {"skills": ["AWS"]}},
            content_type="application/json",
            **self.auth(),
        )

        self.assertTrue(
            ResumeExtraction.objects.get(resume_id=resume_id, field="skills")
            .confirmed_by_user
        )
        self.assertFalse(
            ResumeExtraction.objects.get(resume_id=resume_id, field="email")
            .confirmed_by_user
        )

    def test_fields_outside_the_allowlist_are_ignored(self):
        """A crafted request must not reach lead_score or anything else."""
        resume_id, _ = self.upload()
        # Read the baseline AFTER the upload: confirming a resume legitimately
        # recomputes the score, and comparing against a stale value would test
        # the wrong thing.
        self.candidate.refresh_from_db()
        before = self.candidate.lead_score

        response = self.client.post(
            f"/api/documents/{resume_id}/extractions/apply",
            {"fields": {"lead_score": 100, "email": "attacker@example.com"}},
            content_type="application/json",
            **self.auth(),
        )

        self.assertEqual(response.status_code, 400)
        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.email, "priya@example.com")
        self.assertEqual(self.candidate.lead_score, before)

    def test_another_candidate_cannot_read_or_apply(self):
        resume_id, _ = self.upload()

        read = self.client.get(
            f"/api/documents/{resume_id}/extractions", **self.auth(self.other_token)
        )
        write = self.client.post(
            f"/api/documents/{resume_id}/extractions/apply",
            {"fields": {"skills": ["AWS"]}},
            content_type="application/json",
            **self.auth(self.other_token),
        )

        self.assertEqual(read.status_code, 403)
        self.assertEqual(write.status_code, 403)

    def test_a_parse_failure_does_not_undo_the_upload(self):
        """A PDF with no text layer still uploaded fine."""
        resume_id, confirm = self.upload(body=make_pdf(""))

        self.assertEqual(confirm.status_code, 200)
        self.assertEqual(confirm.json()["upload_status"], "uploaded")
        resume = Resume.objects.get(pk=resume_id)
        self.assertEqual(resume.parse_status, Resume.ParseStatus.FAILED)
        self.assertIn("No text", resume.parse_error)

    def test_review_reports_a_parse_failure_honestly(self):
        resume_id, _ = self.upload(body=make_pdf(""))

        response = self.client.get(
            f"/api/documents/{resume_id}/extractions", **self.auth()
        )

        body = response.json()
        self.assertEqual(body["parse_status"], "failed")
        self.assertTrue(body["parse_error"])
        self.assertEqual(body["extractions"], [])

    def test_reparsing_replaces_rather_than_duplicates(self):
        resume_id, _ = self.upload()
        first = ResumeExtraction.objects.filter(resume_id=resume_id).count()

        from .extraction_views import run_parse

        run_parse(Resume.objects.get(pk=resume_id))

        self.assertEqual(
            ResumeExtraction.objects.filter(resume_id=resume_id).count(), first
        )
