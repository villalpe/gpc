from django.db import models

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
    full_name = models.CharField(max_length=150)
    company = models.CharField(max_length=150, blank=True, default="")
    email = models.EmailField()
    phone = models.CharField(max_length=30)

    # Envío
    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES)
    service_type = models.CharField(max_length=50)

    origin_country = models.CharField(max_length=80)
    origin_zip = models.CharField(max_length=12)
    dest_country = models.CharField(max_length=80)
    dest_zip = models.CharField(max_length=12)
    dest_city = models.CharField(max_length=80, blank=True, default="")

    # Paquete
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2)
    length_cm = models.DecimalField(max_digits=10, decimal_places=2)
    width_cm = models.DecimalField(max_digits=10, decimal_places=2)
    height_cm = models.DecimalField(max_digits=10, decimal_places=2)
    pieces = models.PositiveIntegerField(default=1)

    declared_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    requires_insurance = models.BooleanField(default=False)

    urgency = models.CharField(max_length=20, choices=URGENCY_CHOICES)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    pickup = models.BooleanField(default=True)

    notes = models.TextField(blank=True, default="")

    # Resultado de cotización (snapshot para auditoría/demo)
    result_weight = models.JSONField(default=dict)   # {real_kg, volumetric_kg, chargeable_kg, volumetric_factor}
    result_options = models.JSONField(default=list)  # top 3 options

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"QuoteRequest #{self.id} - {self.full_name} ({self.scope})"