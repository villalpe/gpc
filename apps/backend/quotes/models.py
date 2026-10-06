from django.conf import settings
from django.db import models


class Customer(models.Model):
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quote_customers",
    )
    full_name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=150, blank=True, default="")
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30)

    pickup_address_line1 = models.CharField(max_length=180)
    pickup_city = models.CharField(max_length=80)
    pickup_zip = models.CharField(max_length=12)
    pickup_country = models.CharField(max_length=80, default="México")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Customer #{self.id} - {self.full_name}"


class QuoteRequest(models.Model):
    SCOPE_CHOICES = [
        ("nacional", "Nacional"),
        ("internacional", "Internacional"),
    ]

    URGENCY_CHOICES = [
        ("economico", "Económico"),
        ("express", "Express"),
        ("prioritario", "Prioritario"),
    ]

    FREQUENCY_CHOICES = [
        ("unico", "Único"),
        ("semanal", "Semanal"),
        ("mensual", "Mensual"),
    ]

    # Contacto
    full_name = models.CharField(max_length=150, blank=True, default="")
    company_name = models.CharField(max_length=150, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")

    # Envío
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="nacional")
    service_type = models.CharField(max_length=50, blank=True, default="")

    origin_country = models.CharField(max_length=80, default="MX")
    origin_zip = models.CharField(max_length=12)
    dest_country = models.CharField(max_length=80, default="MX")
    dest_zip = models.CharField(max_length=12)
    dest_city = models.CharField(max_length=80, blank=True, default="")
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quotes",
    )

    # Paquete
    weight_kg = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    length_cm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    width_cm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    height_cm = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    pieces = models.PositiveIntegerField(default=1)

    declared_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    requires_insurance = models.BooleanField(default=False)

    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES, blank=True, default="")
    frequency = models.CharField(
        max_length=20, choices=FREQUENCY_CHOICES, blank=True, default=""
    )
    pickup = models.BooleanField(default=True)

    notes = models.TextField(blank=True, default="")

    # Multi-tenant / proveedor
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="quote_requests",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quote_requests",
    )
    provider = models.CharField(max_length=30, blank=True, default="")
    provider_quotation_id = models.CharField(max_length=100, blank=True, default="")

    origin_state = models.CharField(max_length=80, blank=True, default="")
    origin_city = models.CharField(max_length=80, blank=True, default="")
    origin_area = models.CharField(max_length=120, blank=True, default="")
    dest_state = models.CharField(max_length=80, blank=True, default="")
    dest_area = models.CharField(max_length=120, blank=True, default="")

    # Resultado de cotización (snapshot normalizado, incluye precios; solo staff)
    result_weight = models.JSONField(
        default=dict
    )  # {real_kg, volumetric_kg, chargeable_kg, volumetric_factor}
    result_options = models.JSONField(default=list)  # top 3 options

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"QuoteRequest #{self.id} - {self.full_name} ({self.scope})"


class QuoteParcel(models.Model):
    quote = models.ForeignKey(QuoteRequest, on_delete=models.CASCADE, related_name="parcels")
    length_cm = models.PositiveIntegerField()
    width_cm = models.PositiveIntegerField()
    height_cm = models.PositiveIntegerField()
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"QuoteParcel #{self.id} (quote {self.quote_id})"
