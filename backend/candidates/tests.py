from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings

from jobs.models import EmployerSource, Job, SponsorshipStatus
from leads.models import Lead

from .models import Application, Assessment, Candidate

API_TEST = {
    "REST_FRAMEWORK": {"DEFAULT_THROTTLE_CLASSES": [], "DEFAULT_THROTTLE_RATES": {}},
    "SECURE_SSL_REDIRECT": False,
}

VALID = {
    "full_name": "Priya Raman",
    "email": "Priya@Example.com",
    "work_status_pref": "opt",
    "target_role": "DevOps Engineer",
    "experience_level": "3-5",
    "work_mode": "remote",
    "preferred_locations": "Austin, Dallas",
    "answers": {"signals": ["tailored", "metrics"]},
    "overall": 61,
    "resume_score": 70,
    "targeting_score": 56,
    "ats_score": 48,
    "interview_score": 70,
    "website": "",
}


@override_settings(**API_TEST)
class AssessmentIntakeTests(TestCase):
    url = "/api/assessments/"

    def setUp(self):
        super().setUp()
        cache.clear()

    @patch("candidates.views.notify_new_lead")
    def test_creates_candidate_assessment_and_lead(self, notify):
        response = self.client.post(self.url, VALID, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        candidate = Candidate.objects.get()
        # Email is the identity key, so it must be normalised.
        self.assertEqual(candidate.email, "priya@example.com")
        self.assertEqual(candidate.target_role, "DevOps Engineer")
        self.assertEqual(candidate.preferred_locations, ["Austin", "Dallas"])

        assessment = Assessment.objects.get()
        self.assertEqual(assessment.overall, 61)
        self.assertEqual(assessment.method, Assessment.Method.SELF_REPORT_V1)

        # The existing CRM path must keep working unchanged.
        self.assertEqual(Lead.objects.count(), 1)
        notify.assert_called_once()

    @patch("candidates.views.notify_new_lead")
    def test_second_assessment_reuses_the_candidate(self, notify):
        self.client.post(self.url, VALID, content_type="application/json")
        self.client.post(self.url, {**VALID, "overall": 78},
                         content_type="application/json")

        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(Assessment.objects.count(), 2)

    @patch("candidates.views.notify_new_lead")
    def test_blank_answers_do_not_wipe_earlier_ones(self, notify):
        """A returning candidate who skips a question keeps their old answer."""
        self.client.post(self.url, VALID, content_type="application/json")
        self.client.post(
            self.url,
            {**VALID, "target_role": "", "preferred_locations": ""},
            content_type="application/json",
        )

        candidate = Candidate.objects.get()
        self.assertEqual(candidate.target_role, "DevOps Engineer")
        self.assertEqual(candidate.preferred_locations, ["Austin", "Dallas"])

    @patch("candidates.views.notify_new_lead")
    def test_honeypot_is_rejected(self, notify):
        response = self.client.post(
            self.url, {**VALID, "website": "http://spam"}, content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Candidate.objects.count(), 0)
        notify.assert_not_called()

    @patch("candidates.views.notify_new_lead")
    def test_out_of_range_score_is_rejected(self, notify):
        response = self.client.post(
            self.url, {**VALID, "overall": 140}, content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Assessment.objects.count(), 0)

    @patch("candidates.views.notify_new_lead")
    def test_a_failing_notification_does_not_lose_the_candidate(self, notify):
        notify.side_effect = RuntimeError("Resend is down")

        response = self.client.post(self.url, VALID, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(Assessment.objects.count(), 1)

    @patch("candidates.views.notify_new_lead")
    def test_lead_score_is_not_returned_to_the_candidate(self, notify):
        """Internal triage value. It must never reach the person it scores."""
        response = self.client.post(self.url, VALID, content_type="application/json")

        self.assertNotIn("lead_score", response.content.decode())


class LeadScoreTests(TestCase):
    def test_score_reflects_real_activity_only(self):
        candidate = Candidate.objects.create(email="a@example.com", full_name="A")
        self.assertEqual(candidate.recompute_lead_score(), 0)

        candidate.target_role = "Data Engineer"
        candidate.work_mode = "remote"
        candidate.save()
        # target role 10 + preferences 10
        self.assertEqual(candidate.recompute_lead_score(), 20)

        Assessment.objects.create(
            candidate=candidate, overall=60, resume_score=60, targeting_score=60,
            ats_score=60, interview_score=60,
        )
        self.assertEqual(candidate.recompute_lead_score(), 40)


class ApplicationStatusTests(TestCase):
    """STARTED and APPLIED are distinct, and only a candidate action bridges
    them — the platform never observes an external submission."""

    def setUp(self):
        self.candidate = Candidate.objects.create(email="b@example.com", full_name="B")
        source = EmployerSource.objects.create(
            provider=EmployerSource.Provider.GREENHOUSE,
            board_token="example", employer_name="Example",
        )
        self.job = Job.objects.create(
            source="greenhouse", source_job_id="1", employer_source=source,
            title="DevOps Engineer", company="Example",
            application_url="https://example.com/jobs/1",
        )

    def test_new_application_starts_as_started_not_applied(self):
        app = Application.objects.create(candidate=self.candidate, job=self.job)

        self.assertEqual(app.status, Application.Status.STARTED)
        self.assertIsNone(app.applied_at)

    def test_mark_applied_is_explicit_and_stamps_a_time(self):
        app = Application.objects.create(candidate=self.candidate, job=self.job)

        app.mark_applied()
        app.refresh_from_db()

        self.assertEqual(app.status, Application.Status.APPLIED)
        self.assertIsNotNone(app.applied_at)


class JobDefaultsTests(TestCase):
    def test_sponsorship_defaults_to_not_stated(self):
        """~98.5% of real postings say nothing. The default must be the
        honest 'not stated', never an inferred yes or no."""
        source = EmployerSource.objects.create(
            provider=EmployerSource.Provider.LEVER,
            board_token="ex", employer_name="Ex",
        )
        job = Job.objects.create(
            source="lever", source_job_id="9", employer_source=source,
            title="SRE", company="Ex", application_url="https://ex.com/9",
        )

        self.assertEqual(job.sponsorship_status, SponsorshipStatus.NOT_STATED)
        self.assertEqual(job.sponsorship_evidence, "")
