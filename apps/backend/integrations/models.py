from django.conf import settings
from django.db import models


class FedexSavedAddress(models.Model):
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    label = models.CharField(max_length=120)
    party = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["company", "created_at"])]


class FedexNotificationPreferences(models.Model):
    company = models.ForeignKey("companies.Company", on_delete=models.CASCADE)
    cb_number = models.CharField(max_length=10)
    preferences = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["company", "cb_number"], name="fedex_pref_company_cb")
        ]