from django.urls import path

from . import resume_views, views

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
]
