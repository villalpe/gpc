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

class SavedAddress(models.Model):
    KIND_CHOICES = [
        ("origin", "Origen"),
        ("destination", "Destino"),
    ]

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="saved_addresses",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="saved_addresses",
    )

    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    label = models.CharField(max_length=120, blank=True, default="")

    # Datos "cliente/remitente/destinatario" según contexto de uso
    client_name = models.CharField(max_length=150, blank=True, default="")
    client_phone = models.CharField(max_length=30, blank=True, default="")
    contact_name = models.CharField(max_length=150, blank=True, default="")
    contact_phone = models.CharField(max_length=30, blank=True, default="")
    contact_email = models.EmailField(blank=True, default="")
    company_name = models.CharField(max_length=150, blank=True, default="")

    # Dirección
    country = models.CharField(max_length=2, default="MX")
    postal_code = models.CharField(max_length=12)
    state = models.CharField(max_length=80)
    city = models.CharField(max_length=80)
    area = models.CharField(max_length=120)
    street = models.CharField(max_length=180, blank=True, default="")
    exterior_number = models.CharField(max_length=30, blank=True, default="")
    interior_number = models.CharField(max_length=30, blank=True, default="")
    reference = models.CharField(max_length=200, blank=True, default="")
    additional_info = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["company", "kind"]),
            models.Index(fields=["company", "postal_code"]),
        ]

    def __str__(self):
        return f"SavedAddress #{self.id} ({self.kind}) - {self.label or self.postal_code}"

class SavedPackage(models.Model):
    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="saved_packages"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="saved_packages",
    )
    label = models.CharField(max_length=120)
    length_cm = models.PositiveIntegerField()
    width_cm = models.PositiveIntegerField()
    height_cm = models.PositiveIntegerField()
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3)
    contents_description = models.CharField(max_length=255)
    consignment_note = models.CharField(max_length=20, blank=True, default="")
    packaging_type = models.CharField(max_length=10, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [models.Index(fields=["company"])]

    def __str__(self):
        return f"SavedPackage #{self.id} - {self.label}"


class Shipment(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("booked", "Guía generada"),
        ("canceled", "Cancelado"),
    ]

    company = models.ForeignKey(
        "companies.Company", on_delete=models.CASCADE, related_name="shipments"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="shipments",
    )
    quote = models.ForeignKey(
        QuoteRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name="shipments"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    provider = models.CharField(max_length=30, default="skydropx")
    provider_quotation_id = models.CharField(max_length=100)
    rate_id = models.CharField(max_length=100)
    carrier = models.CharField(max_length=80, blank=True, default="")
    service = models.CharField(max_length=120, blank=True, default="")
    estimated_days = models.IntegerField(null=True, blank=True)
    rate_snapshot = models.JSONField(default=dict)  # incluye precio; solo staff

    origin = models.JSONField(default=dict)
    destination = models.JSONField(default=dict)
    origin_address = models.ForeignKey(
        SavedAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    destination_address = models.ForeignKey(
        SavedAddress, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    weight_summary = models.JSONField(default=dict)
    notes = models.TextField(blank=True, default="")

    # Para la fase de guías
    provider_shipment_id = models.CharField(max_length=100, blank=True, default="")
    tracking_number = models.CharField(max_length=60, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["company", "status"])]

    def __str__(self):
        return f"Shipment #{self.id} ({self.status})"


class ShipmentParcel(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name="parcels")
    saved_package = models.ForeignKey(
        SavedPackage, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )
    length_cm = models.PositiveIntegerField()
    width_cm = models.PositiveIntegerField()
    height_cm = models.PositiveIntegerField()
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3)
    declared_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    package_protected = models.BooleanField(default=False)
    contents_description = models.CharField(max_length=255)
    consignment_note = models.CharField(max_length=20, blank=True, default="")
    packaging_type = models.CharField(max_length=10, blank=True, default="")
    consignment_description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["id"]   

class SatClaveProdServ(models.Model):
    clave = models.CharField(max_length=8, unique=True, db_index=True)
    descripcion = models.TextField()
    vigente = models.BooleanField(default=True)
    fecha_inicio_vigencia = models.DateField(null=True, blank=True)
    fecha_fin_vigencia = models.DateField(null=True, blank=True)
    incluir_iva_trasladado = models.CharField(max_length=2, blank=True, default="")
    incluir_ieps_trasladado = models.CharField(max_length=2, blank=True, default="")
    complemento_que_debe_incluir = models.CharField(max_length=255, blank=True, default="")
    estimulo_franja_fronteriza = models.CharField(max_length=2, blank=True, default="")
    palabras_similares = models.TextField(blank=True, default="")

    class Meta:
        db_table = "sat_clave_prod_serv"
        ordering = ["clave"]

    def __str__(self):
        return f"{self.clave} - {self.descripcion[:80]}"             