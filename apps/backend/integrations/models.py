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


class FedexShipment(models.Model):
    class Status(models.TextChoices):
        PROCESSING = "processing", "En proceso"
        CREATED = "created", "Guía creada"
        UNCERTAIN = "uncertain", "Resultado por verificar"
        FAILED = "failed", "FedEx rechazó la solicitud"

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="fedex_shipments"
    )
    cb_number = models.CharField(max_length=10)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="fedex_shipments_created",
    )
    status = models.CharField(max_length=20, choices=Status.choices)
    ship_date = models.DateField()
    service_type = models.CharField(max_length=60)
    pickup_type = models.CharField(max_length=40)
    tracking_number = models.CharField(max_length=40, blank=True, default="")
    tracking_numbers = models.JSONField(default=list)
    shipment_data = models.JSONField()
    error_detail = models.CharField(max_length=500, blank=True, default="")
    warning = models.CharField(max_length=500, blank=True, default="")
    fedex_transaction_id = models.CharField(max_length=100, blank=True, default="")
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fedex_shipments_resolved",
    )
    resolution_note = models.CharField(max_length=500, blank=True, default="")
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["company", "cb_number"],
                condition=models.Q(status__in=["processing", "created", "uncertain"]),
                name="fedex_shipment_active_company_cb",
            )
        ]
        indexes = [
            models.Index(fields=["company", "status", "created_at"]),
            models.Index(fields=["company", "tracking_number"]),
        ]


class FedexShipmentLabel(models.Model):
    shipment = models.ForeignKey(
        FedexShipment, on_delete=models.CASCADE, related_name="labels"
    )
    file_name = models.CharField(max_length=120)
    content = models.BinaryField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]