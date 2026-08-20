from unittest.mock import patch

from django.test import TestCase, override_settings

from .models import ContactMessage, Lead

VALID_LEAD = {
    "full_name": "Priya Raman",
    "email": "priya@example.com",
    "phone": "+1 555 0100",
    "work_authorization": "opt",
    "target_roles": "Senior data engineer — Bay Area or remote",
    "linkedin_url": "https://www.linkedin.com/in/example",
    "message": "Graduating in December, want to start early.",
}

# Throttling is on in production but would make these tests order-dependent.
NO_THROTTLE = {"DEFAULT_THROTTLE_CLASSES": [], "DEFAULT_THROTTLE_RATES": {}}

# Production forces HTTPS, so the test client's http:// requests would all be
# answered with a 301 instead of reaching a view. Disabling the redirect here
# keeps the suite deterministic no matter what DJANGO_DEBUG happens to be in
# the shell that runs it — which is how CI will run it.
API_TEST = {"REST_FRAMEWORK": NO_THROTTLE, "SECURE_SSL_REDIRECT": False}


@override_settings(**API_TEST)
class LeadCreateTests(TestCase):
    url = "/api/leads/"

    @patch("leads.views.notify_new_lead")
    def test_valid_lead_is_stored(self, notify):
        response = self.client.post(self.url, VALID_LEAD, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get()
        self.assertEqual(lead.full_name, "Priya Raman")
        self.assertEqual(lead.work_authorization, "opt")
        self.assertEqual(lead.status, "new")
        notify.assert_called_once_with(lead)

    @patch("leads.views.notify_new_lead")
    def test_honeypot_submission_is_rejected(self, notify):
        payload = {**VALID_LEAD, "website": "http://spam.example"}

        response = self.client.post(self.url, payload, content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Lead.objects.count(), 0)
        notify.assert_not_called()

    @patch("leads.views.notify_new_lead")
    def test_honeypot_field_is_never_persisted(self, notify):
        payload = {**VALID_LEAD, "website": ""}

        response = self.client.post(self.url, payload, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        self.assertFalse(hasattr(Lead.objects.get(), "website"))

    @patch("leads.views.notify_new_lead")
    def test_missing_email_is_rejected(self, notify):
        payload = {k: v for k, v in VALID_LEAD.items() if k != "email"}

        response = self.client.post(self.url, payload, content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.json())
        self.assertEqual(Lead.objects.count(), 0)

    @patch("leads.views.notify_new_lead")
    def test_unknown_work_authorization_is_rejected(self, notify):
        payload = {**VALID_LEAD, "work_authorization": "h4-ead-maybe"}

        response = self.client.post(self.url, payload, content_type="application/json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Lead.objects.count(), 0)

    @patch("leads.views.notify_new_lead")
    def test_a_failing_notification_does_not_lose_the_lead(self, notify):
        """The lead is already saved. Losing it because an email provider
        hiccuped would be the worst possible trade."""
        notify.side_effect = RuntimeError("Resend is down")

        response = self.client.post(self.url, VALID_LEAD, content_type="application/json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Lead.objects.count(), 1)

    @patch("leads.views.notify_new_lead")
    def test_request_metadata_is_captured(self, notify):
        response = self.client.post(
            self.url,
            {**VALID_LEAD, "source_path": "/book-demo"},
            content_type="application/json",
            HTTP_USER_AGENT="Mozilla/5.0 (test)",
            HTTP_X_FORWARDED_FOR="203.0.113.9, 10.0.0.1",
        )

        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get()
        self.assertEqual(lead.source_path, "/book-demo")
        self.assertEqual(lead.user_agent, "Mozilla/5.0 (test)")
        # First entry is the real client; the rest are proxies.
        self.assertEqual(lead.ip_address, "203.0.113.9")


@override_settings(**API_TEST)
class ContactMessageTests(TestCase):
    url = "/api/contact/"

    @patch("leads.views.notify_contact_message")
    def test_valid_message_is_stored(self, notify):
        response = self.client.post(
            self.url,
            {
                "name": "Arun K",
                "email": "arun@example.com",
                "message": "Do you work with people on STEM OPT?",
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ContactMessage.objects.count(), 1)
        notify.assert_called_once()

    @patch("leads.views.notify_contact_message")
    def test_one_word_message_is_rejected(self, notify):
        response = self.client.post(
            self.url,
            {"name": "Arun K", "email": "arun@example.com", "message": "hi"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContactMessage.objects.count(), 0)


@override_settings(**API_TEST)
class EndpointAvailabilityTests(TestCase):
    def test_health_reports_channel_configuration(self):
        response = self.client.get("/api/health/")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        # Uploads stay false until object storage exists.
        self.assertFalse(body["uploads"])

    def test_document_upload_is_honestly_unavailable(self):
        """503 rather than accepting a file Render's disk would lose."""
        response = self.client.post("/api/documents/", {}, content_type="application/json")

        self.assertEqual(response.status_code, 503)


class NotificationTests(TestCase):
    @override_settings(RESEND_API_KEY="")
    def test_email_without_api_key_does_not_send(self):
        from .notifications import send_email

        self.assertFalse(
            send_email(to=["a@example.com"], subject="x", text="y")
        )

    @override_settings(WHATSAPP_ENABLED=False)
    def test_whatsapp_is_off_by_default(self):
        from .notifications import send_whatsapp

        self.assertFalse(send_whatsapp(to="15550100", text="hi"))

    @override_settings(
        WHATSAPP_ENABLED=True,
        WHATSAPP_PROVIDER="callmebot",
        CALLMEBOT_API_KEY="",
    )
    def test_callmebot_without_key_fails_loudly(self):
        from .notifications import send_whatsapp

        with self.assertLogs("leads.notifications", level="ERROR"):
            self.assertFalse(send_whatsapp(to="15550100", text="hi"))

    @override_settings(
        WHATSAPP_ENABLED=True,
        WHATSAPP_PROVIDER="meta",
        WHATSAPP_PHONE_NUMBER_ID="",
        WHATSAPP_ACCESS_TOKEN="",
    )
    def test_meta_without_credentials_fails_loudly(self):
        from .notifications import send_whatsapp

        with self.assertLogs("leads.notifications", level="ERROR"):
            self.assertFalse(send_whatsapp(to="15550100", text="hi"))

    @override_settings(WHATSAPP_ENABLED=True, WHATSAPP_PROVIDER="carrier-pigeon")
    def test_unknown_provider_fails_loudly(self):
        from .notifications import send_whatsapp

        with self.assertLogs("leads.notifications", level="ERROR"):
            self.assertFalse(send_whatsapp(to="15550100", text="hi"))

    @override_settings(
        RESEND_API_KEY="",
        WHATSAPP_ENABLED=True,
        WHATSAPP_PROVIDER="callmebot",
        CALLMEBOT_API_KEY="k",
        NOTIFY_TEAM_WHATSAPP=["15550100"],
    )
    @patch("leads.notifications.requests.get")
    def test_whatsapp_alert_carries_no_candidate_data(self, get):
        """CallMeBot is an unofficial relay. A candidate's name, email and
        work-authorisation status must not travel through it."""
        from .notifications import notify_new_lead

        get.return_value.status_code = 200
        lead = Lead.objects.create(**VALID_LEAD)

        notify_new_lead(lead)

        sent = get.call_args.kwargs["params"]["text"]
        self.assertIn(f"#{lead.pk}", sent)
        self.assertNotIn("Priya", sent)
        self.assertNotIn("priya@example.com", sent)
        self.assertNotIn("OPT", sent)

    @override_settings(RESEND_API_KEY="test-key")
    @patch("leads.notifications.requests.post")
    def test_new_lead_emails_candidate_and_team(self, post):
        from .notifications import notify_new_lead

        post.return_value.status_code = 200
        lead = Lead.objects.create(**{k: v for k, v in VALID_LEAD.items()})

        notify_new_lead(lead)

        self.assertEqual(post.call_count, 2)
        candidate_email = post.call_args_list[0].kwargs["json"]
        self.assertEqual(candidate_email["to"], ["priya@example.com"])
        # The standing copy rule, enforced by a test so it cannot drift.
        self.assertIn("never on the call", candidate_email["text"])
