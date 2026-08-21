# apps/backend/apps/companies/models.py
import uuid

from django.db import models


class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    legal_name = models.CharField(max_length=180)
    trade_name = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(unique=True, max_length=80)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "companies"