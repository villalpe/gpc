from rest_framework import serializers

from .models import Customer, QuoteRequest

PRICE_KEYS = ("price", "price_breakdown", "total_value_with_protection")


def strip_price_fields(option: dict) -> dict:
    return {k: v for k, v in option.items() if k not in PRICE_KEYS}


def group_options(options, show_price: bool) -> dict:
    grouped = {"parcel": [], "freight": []}
    for opt in options or []:
        item = opt if show_price else strip_price_fields(opt)
        grouped["freight" if opt.get("mode") == "freight" else "parcel"].append(item)
    return grouped


class CustomerCreateSerializer(serializers.ModelSerializer):
    company = serializers.CharField(
        source="company_name", required=False, allow_blank=True, max_length=150
    )

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
    company = serializers.CharField(source="company_name", read_only=True)

    class Meta:
        model = Customer
        fields = CustomerCreateSerializer.Meta.fields


class AddressInputSerializer(serializers.Serializer):
    country_code = serializers.CharField(max_length=2)
    postal_code = serializers.CharField(min_length=4, max_length=12)
    state = serializers.CharField(max_length=80)
    city = serializers.CharField(max_length=80)
    area = serializers.CharField(max_length=120)

    def validate_country_code(self, value):
        value = value.strip().upper()
        if value != "MX":
            raise serializers.ValidationError("Solo se soporta país MX por ahora.")
        return value


class ParcelInputSerializer(serializers.Serializer):
    length = serializers.IntegerField(min_value=1)
    width = serializers.IntegerField(min_value=1)
    height = serializers.IntegerField(min_value=1)
    weight = serializers.FloatField(min_value=0.001)
    declared_value = serializers.FloatField(required=False, min_value=0)
    package_protected = serializers.BooleanField(required=False)


class SkydropxQuoteInputSerializer(serializers.Serializer):
    origin = AddressInputSerializer()
    destination = AddressInputSerializer()
    parcels = ParcelInputSerializer(many=True, allow_empty=False)
    requested_carriers = serializers.ListField(
        child=serializers.CharField(max_length=60), required=False, allow_empty=True
    )

    def to_skydropx_payload(self) -> dict:
        data = self.validated_data

        def address(a):
            return {
                "country_code": a["country_code"],
                "postal_code": a["postal_code"],
                "area_level1": a["state"],
                "area_level2": a["city"],
                "area_level3": a["area"],
            }

        quotation = {
            "address_from": address(data["origin"]),
            "address_to": address(data["destination"]),
            "parcels": [dict(p) for p in data["parcels"]],
        }
        if data.get("requested_carriers"):
            quotation["requested_carriers"] = data["requested_carriers"]
        return {"quotation": quotation}


class QuoteOutputSerializer(serializers.ModelSerializer):
    """Salida con precios ocultos del lado servidor según `show_price` en el context."""

    options = serializers.SerializerMethodField()
    parcels = serializers.SerializerMethodField()
    weight = serializers.JSONField(source="result_weight", read_only=True)
    origin = serializers.SerializerMethodField()
    destination = serializers.SerializerMethodField()

    class Meta:
        model = QuoteRequest
        fields = [
            "id",
            "provider",
            "provider_quotation_id",
            "origin",
            "destination",
            "parcels",
            "weight",
            "options",
            "created_at",
        ]

    def get_options(self, obj):
        return group_options(obj.result_options, self.context.get("show_price", False))

    def get_parcels(self, obj):
        return [
            {
                "length_cm": p.length_cm,
                "width_cm": p.width_cm,
                "height_cm": p.height_cm,
                "weight_kg": p.weight_kg,
            }
            for p in obj.parcels.all()
        ]

    def get_origin(self, obj):
        return {
            "country_code": obj.origin_country,
            "postal_code": obj.origin_zip,
            "state": obj.origin_state,
            "city": obj.origin_city,
            "area": obj.origin_area,
        }

    def get_destination(self, obj):
        return {
            "country_code": obj.dest_country,
            "postal_code": obj.dest_zip,
            "state": obj.dest_state,
            "city": obj.dest_city,
            "area": obj.dest_area,
        }
