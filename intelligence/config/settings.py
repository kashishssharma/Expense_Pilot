"""
Django settings for the Intelligence Service.
Reads DATABASE_URL from environment for easy deployment on Railway/Render.
"""
import os
import re
from urllib.parse import unquote
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-in-production')
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'rest_framework',
    'corsheaders',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

# ─── Database ─────────────────────────────────────────────
# Parse DATABASE_URL into Django DATABASES dict
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgres://expense_user:expense_pass@localhost:5432/expense_tracker')

db_match = re.match(r'postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+):?(\d+)?/(.+)', DATABASE_URL)
if db_match:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'USER': unquote(db_match.group(1)),
            'PASSWORD': unquote(db_match.group(2)),
            'HOST': db_match.group(3),
            'PORT': db_match.group(4) or '5432',
            'NAME': unquote(db_match.group(5)),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'expense_tracker',
            'USER': 'expense_user',
            'PASSWORD': 'expense_pass',
            'HOST': 'localhost',
            'PORT': '5432',
        }
    }

# ─── REST Framework ───────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
}

# ─── CORS ─────────────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
