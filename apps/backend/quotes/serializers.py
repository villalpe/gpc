from rest_framework import serializers

from .models import Customer, QuoteRequest, SavedAddress, SavedPackage, Shipment, SatClaveProdServ

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

class SavedAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedAddress
        fields = [
            "id",
            "kind",
            "label",
            "client_name",
            "client_phone",
            "contact_name",
            "contact_phone",
            "contact_email",
            "company_name",
            "country",
            "postal_code",
            "state",
            "city",
            "area",
            "street",
            "exterior_number",
            "interior_number",
            "reference",
            "additional_info",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_country(self, value):
        value = value.strip().upper()
        if value != "MX":
            raise serializers.ValidationError("Solo se soporta país MX por ahora.")
        return value   
        
class SavedPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedPackage
        fields = [
            "id", "label", "length_cm", "width_cm", "height_cm", "weight_kg",
            "contents_description", "consignment_note", "packaging_type",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ShipmentAddressSerializer(serializers.Serializer):
    country_code = serializers.CharField(max_length=2)
    postal_code = serializers.CharField(min_length=4, max_length=12)
    state = serializers.CharField(max_length=80)
    city = serializers.CharField(max_length=80)
    area = serializers.CharField(max_length=120)
    client_name = serializers.CharField(max_length=150)
    client_phone = serializers.CharField(max_length=30)
    street = serializers.CharField(max_length=180)
    exterior_number = serializers.CharField(max_length=30)
    interior_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    reference = serializers.CharField(max_length=200, required=False, allow_blank=True)
    additional_info = serializers.CharField(required=False, allow_blank=True)
    contact_name = serializers.CharField(max_length=150)
    contact_phone = serializers.CharField(max_length=30)
    contact_email = serializers.EmailField()
    company_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    saved_address_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_country_code(self, value):
        value = value.strip().upper()
        if value != "MX":
            raise serializers.ValidationError("Solo se soporta país MX por ahora.")
        return value


class ShipmentParcelInputSerializer(ParcelInputSerializer):
    contents_description = serializers.CharField(max_length=255)
    consignment_note = serializers.CharField(max_length=20, required=False, allow_blank=True)
    packaging_type = serializers.CharField(max_length=10, required=False, allow_blank=True)
    saved_package_id = serializers.IntegerField(required=False, allow_null=True)


class ShipmentCreateSerializer(serializers.Serializer):
    quotation_id = serializers.CharField(max_length=100)
    rate_id = serializers.CharField(max_length=100)
    origin = ShipmentAddressSerializer()
    destination = ShipmentAddressSerializer()
    parcels = ShipmentParcelInputSerializer(many=True, allow_empty=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class ShipmentParcelInputSerializer(ParcelInputSerializer):
    contents_description = serializers.CharField(max_length=255)
    consignment_note = serializers.CharField(max_length=20, required=False, allow_blank=True)
    consignment_description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    packaging_type = serializers.CharField(max_length=10, required=False, allow_blank=True)
    saved_package_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        clave = (attrs.get("consignment_note") or "").strip()

        if clave:
            if not clave.isdigit() or len(clave) != 8:
                raise serializers.ValidationError(
                    {"consignment_note": "La clave SAT debe tener 8 dígitos."}
                )

            sat = SatClaveProdServ.objects.filter(
                clave=clave,
                vigente=True
            ).only("descripcion").first()

            if not sat:
                raise serializers.ValidationError(
                    {"consignment_note": "Clave SAT no válida o no vigente."}
                )

            # Sobrescribe con descripción oficial
            attrs["consignment_description"] = sat.descripcion

        return attrs

class ShipmentCreateSerializer(serializers.Serializer):
    quotation_id = serializers.CharField(max_length=100)
    rate_id = serializers.CharField(max_length=100)
    origin = ShipmentAddressSerializer()
    destination = ShipmentAddressSerializer()
    parcels = ShipmentParcelInputSerializer(many=True, allow_empty=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class ShipmentOutputSerializer(serializers.ModelSerializer):
    parcels = serializers.SerializerMethodField()
    rate = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = [
            "id", "status", "provider", "provider_quotation_id", "rate_id",
            "carrier", "service", "estimated_days", "origin", "destination",
            "weight_summary", "parcels", "rate", "notes", "created_at"
        ]

    def get_parcels(self, obj):
        return [
            {
                "length_cm": p.length_cm,
                "width_cm": p.width_cm,
                "height_cm": p.height_cm,
                "weight_kg": p.weight_kg,
                "declared_value": p.declared_value,
                "package_protected": p.package_protected,
                "contents_description": p.contents_description,
                "consignment_note": p.consignment_note,
                "consignment_description": p.consignment_description,
                "packaging_type": p.packaging_type,
            }
            for p in obj.parcels.all()
        ]

    def get_rate(self, obj):
        rate = obj.rate_snapshot or {}
        return rate if self.context.get("show_price", False) else strip_price_fields(rate)             

class SatClaveProdServSerializer(serializers.ModelSerializer):
    class Meta:
        model = SatClaveProdServ
        fields = ("clave", "descripcion", "vigente")