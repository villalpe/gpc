import uuid

from django.conf import settings
from django.db import models


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # contexto
    request_id = models.CharField(max_length=64, blank=True, default="", db_index=True)
    company_id = models.UUIDField(null=True, blank=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events",
    )

    # evento
    action = models.CharField(max_length=120, db_index=True)  # ej: auth.login.success
    status = models.CharField(max_length=20, db_index=True)   # success|denied|error
    message = models.TextField(blank=True, default="")

    # metadata técnica
    ip = models.GenericIPAddressField(null=True, blank=True)
    method = models.CharField(max_length=10, blank=True, default="")
    path = models.CharField(max_length=255, blank=True, default="")

    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.created_at} {self.action} {self.status}"