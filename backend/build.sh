#!/usr/bin/env bash
# Render build command. Fails the deploy on any error rather than shipping
# a half-migrated service.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
