from rest_framework import serializers
from .models import QuoteRequest, Customer 

SCOPE_CHOICES = ("nacional", "internacional")
URGENCY_CHOICES = ("economico", "express", "prioritario")
FREQUENCY_CHOICES = ("unico", "semanal", "mensual")

class CustomerCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "full_name",
            "company",
            "email",
            "phone",
            "pickup_address_line1",
            "pickup_city",
            "pickup_zip",
            "pickup_country",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "full_name",
            "company",
            "email",
            "phone",
            "pickup_address_line1",
            "pickup_city",
            "pickup_zip",
            "pickup_country",
            "created_at",
        ]

class QuoteRequestCreateSerializer(serializers.Serializer):
    customer_id = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    full_name = serializers.CharField(min_length=3, max_length=150)
    company = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(min_length=8, max_length=30)

    scope = serializers.ChoiceField(choices=SCOPE_CHOICES)
    service_type = serializers.CharField(max_length=50)

    origin_country = serializers.CharField(max_length=80)
    origin_zip = serializers.CharField(min_length=4, max_length=12)
    dest_country = serializers.CharField(max_length=80)
    dest_zip = serializers.CharField(min_length=4, max_length=12)
    dest_city = serializers.CharField(required=False, allow_blank=True, max_length=80)

    weight_kg = serializers.FloatField(min_value=0.01)
    length_cm = serializers.FloatField(min_value=0.01)
    width_cm = serializers.FloatField(min_value=0.01)
    height_cm = serializers.FloatField(min_value=0.01)
    pieces = serializers.IntegerField(min_value=1)

    declared_value = serializers.FloatField(required=False, min_value=0)
    requires_insurance = serializers.BooleanField(default=False)

    urgency = serializers.ChoiceField(choices=URGENCY_CHOICES)
    frequency = serializers.ChoiceField(choices=FREQUENCY_CHOICES)
    pickup = serializers.BooleanField(default=True)

    notes = serializers.CharField(required=False, allow_blank=True)


class QuoteRequestListSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteRequest
        fields = [
            "id",
            "full_name",
            "company",
            "email",
            "phone",
            "scope",
            "origin_country",
            "origin_zip",
            "dest_country",
            "dest_zip",
            "result_weight",
            "result_options",
            "created_at",
        ]


class QuoteRequestDetailSerializer(serializers.ModelSerializer):
    customer_id = serializers.SerializerMethodField()
    customer_pickup_address_line1 = serializers.SerializerMethodField()
    customer_pickup_city = serializers.SerializerMethodField()
    customer_pickup_zip = serializers.SerializerMethodField()
    customer_pickup_country = serializers.SerializerMethodField()

    class Meta:
        model = QuoteRequest
        fields = "__all__"

    def _get_customer(self, obj):
      # Evita AttributeError si aún no existe FK en el modelo/migración
      return getattr(obj, "customer", None)

    def get_customer_id(self, obj):
      c = self._get_customer(obj)
      return c.id if c else None

    def get_customer_pickup_address_line1(self, obj):
      c = self._get_customer(obj)
      return c.pickup_address_line1 if c else ""

    def get_customer_pickup_city(self, obj):
      c = self._get_customer(obj)
      return c.pickup_city if c else ""

    def get_customer_pickup_zip(self, obj):
      c = self._get_customer(obj)
      return c.pickup_zip if c else ""

    def get_customer_pickup_country(self, obj):
      c = self._get_customer(obj)
      return c.pickup_country if c else ""