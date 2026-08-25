from django.urls import path

from . import views

urlpatterns = [
    path("assessments/", views.create_assessment, name="assessment-create"),
]
