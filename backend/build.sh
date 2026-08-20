#!/usr/bin/env bash
# Render build command. Fails the deploy on any error rather than shipping
# a half-migrated service.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# Bootstrap the admin account.
#
# Render's free tier has no Shell, so `createsuperuser` cannot be run
# interactively there. Setting DJANGO_SUPERUSER_USERNAME / _EMAIL / _PASSWORD
# in the dashboard creates it on the next deploy instead.
#
# `|| true` because the command exits non-zero once the user already exists,
# and that must not fail every subsequent deploy. Once the account is created,
# DELETE the password variable from Render — leaving a live admin password in
# the environment is an unnecessary standing risk.
if [[ -n "${DJANGO_SUPERUSER_USERNAME:-}" && -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]]; then
  echo "Ensuring superuser '${DJANGO_SUPERUSER_USERNAME}' exists…"
  python manage.py createsuperuser --noinput || true
fi
