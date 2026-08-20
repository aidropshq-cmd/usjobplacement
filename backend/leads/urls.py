from django.urls import path

from . import views

urlpatterns = [
    path("leads/", views.LeadCreateView.as_view(), name="lead-create"),
    path("contact/", views.ContactMessageCreateView.as_view(), name="contact-create"),
    path("documents/", views.upload_document, name="document-upload"),
    path("health/", views.health, name="health"),
]
