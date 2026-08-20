"""
Django settings for the usjobplacement API.

Deploys to Render; the database is Neon. Everything environment-specific comes
from env vars — nothing secret is ever committed. See backend/.env.example.
"""

from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str) -> list[str]:
    raw = os.getenv(name, "")
    return [item.strip() for item in raw.split(",") if item.strip()]


# ---------------------------------------------------------------- core

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "insecure-dev-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", False)

# Render injects RENDER_EXTERNAL_HOSTNAME. Keep the explicit list for local work.
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS") or ["localhost", "127.0.0.1"]
if hostname := os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    ALLOWED_HOSTS.append(hostname)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "leads",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ---------------------------------------------------------------- database

# Neon in every real environment. SQLite only so `manage.py check` and
# makemigrations work on a laptop without a connection string.
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'dev.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=bool(os.getenv("DATABASE_URL")),
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": f"django.contrib.auth.password_validation.{name}"}
    for name in (
        "UserAttributeSimilarityValidator",
        "MinimumLengthValidator",
        "CommonPasswordValidator",
        "NumericPasswordValidator",
    )
]

# ---------------------------------------------------------------- i18n / static

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------------------------------------------------------------- CORS

# Locked to the subdomain. Never use CORS_ALLOW_ALL_ORIGINS here — this API
# accepts personal data from a public form.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS") or [
    "https://usjobplacement.zapkitt.com",
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = False

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS") or CORS_ALLOWED_ORIGINS

# ---------------------------------------------------------------- DRF

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle"],
    # A real person submits one lead. This is generous for them and hostile to
    # a script hammering the endpoint.
    "DEFAULT_THROTTLE_RATES": {"anon": os.getenv("API_THROTTLE_ANON", "12/hour")},
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}
if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
        "rest_framework.renderers.BrowsableAPIRenderer"
    )

# ---------------------------------------------------------------- notifications

# Email — Resend. Without an API key the adapter logs instead of sending, so
# local development never silently depends on a live outbound service.
#
# EMAIL_FROM must be on a domain you can prove you own — Resend verifies it
# by DNS. A gmail.com sender is impossible for anyone but Google, so mail
# goes OUT as @zapkitt.com and REPLIES come back to the team address.
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "ZapKitt Placement <noreply@zapkitt.com>")
EMAIL_REPLY_TO = os.getenv("EMAIL_REPLY_TO", "aidropshq@gmail.com")
NOTIFY_TEAM_EMAILS = env_list("NOTIFY_TEAM_EMAILS") or ["aidropshq@gmail.com"]

# WhatsApp — pluggable, OFF until configured.
#
# Two providers:
#   "callmebot" — free, works in minutes, no Meta account. It is an unofficial
#                 third-party relay, so we send NO candidate personal data
#                 through it: the alert carries a lead id and nothing more.
#                 No SLA; treat it as a convenience, not a system of record.
#   "meta"      — the official Cloud API. Needs a Meta Business Account, a
#                 verified sender number and pre-approved templates, which
#                 takes days to obtain and cannot be provisioned from code.
WHATSAPP_ENABLED = env_bool("WHATSAPP_ENABLED", False)
WHATSAPP_PROVIDER = os.getenv("WHATSAPP_PROVIDER", "callmebot")
CALLMEBOT_API_KEY = os.getenv("CALLMEBOT_API_KEY", "")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
WHATSAPP_TEMPLATE_LEAD = os.getenv("WHATSAPP_TEMPLATE_LEAD", "")
NOTIFY_TEAM_WHATSAPP = env_list("NOTIFY_TEAM_WHATSAPP")

SITE_URL = os.getenv("SITE_URL", "https://usjobplacement.zapkitt.com")
ADMIN_URL = os.getenv("ADMIN_URL", "https://usjobplacement-api.onrender.com/admin/")

# ---------------------------------------------------------------- security

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
