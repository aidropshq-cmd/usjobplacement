from django.urls import path

from . import account_views, extraction_views, resume_views, views

urlpatterns = [
    path("assessments/", views.create_assessment, name="assessment-create"),
    # Resume lifecycle. Replaces the leads app's 503 placeholder.
    path("documents/", resume_views.create_upload_intent, name="resume-intent"),
    path(
        "documents/<int:resume_id>/confirm",
        resume_views.confirm_upload,
        name="resume-confirm",
    ),
    path(
        "documents/<int:resume_id>/download",
        resume_views.download_url,
        name="resume-download",
    ),
    path("documents/<int:resume_id>", resume_views.delete_resume, name="resume-delete"),
    # Parsed fields: review, then apply only what the candidate confirms.
    path(
        "documents/<int:resume_id>/extractions",
        extraction_views.list_extractions,
        name="resume-extractions",
    ),
    path(
        "documents/<int:resume_id>/extractions/apply",
        extraction_views.apply_extractions,
        name="resume-extractions-apply",
    ),
    # Self-deletion. Closes step 11 of the verification workflow and gives the
    # privacy commitment an actual mechanism.
    path("candidates/me", account_views.delete_me, name="candidate-delete"),
]
