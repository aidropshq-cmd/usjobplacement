from django.contrib import admin
from django.urls import include, path

from leads.views import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("candidates.urls")),
    path("api/", include("leads.urls")),
    # Render's health check points here.
    path("healthz", health),
]

admin.site.site_header = "ZapKitt Placement"
admin.site.site_title = "ZapKitt Placement"
admin.site.index_title = "Leads and consultations"
