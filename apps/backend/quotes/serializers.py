from rest_framework import serializers
from .models import QuoteRequest

SCOPE_CHOICES = ("nacional", "internacional")
URGENCY_CHOICES = ("economico", "express", "prioritario")
FREQUENCY_CHOICES = ("unico", "semanal", "mensual")

class QuoteRequestCreateSerializer(serializers.Serializer):
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
    class Meta:
        model = QuoteRequest
        fields = "__all__"