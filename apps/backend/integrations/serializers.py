import base64
import binascii
from decimal import Decimal

from rest_framework import serializers


class FedexTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=50)


class FedexRateAddressSerializer(serializers.Serializer):
    country_code = serializers.RegexField(r"^[A-Za-z]{2}$")
    postal_code = serializers.CharField(max_length=20)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=3, required=False, allow_blank=True)


class FedexCommoditySerializer(serializers.Serializer):
    description = serializers.CharField(max_length=450)
    hs_code = serializers.CharField(max_length=20)
    origin_country = serializers.RegexField(r"^[A-Za-z]{2}$")
    quantity = serializers.IntegerField(min_value=1)
    weight = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal("0.001"),
    )
    weight_units = serializers.ChoiceField(choices=("KG", "LB"))
    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
    )
    customs_value = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
    )
    customs_currency = serializers.RegexField(r"^[A-Za-z]{3}$")


class FedexRatePackageSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=40)
    weight = serializers.DecimalField(
        max_digits=10, decimal_places=3, min_value=Decimal("0.001")
    )
    weight_units = serializers.ChoiceField(choices=("KG", "LB"))
    length = serializers.IntegerField(min_value=1, max_value=9999)
    width = serializers.IntegerField(min_value=1, max_value=9999)
    height = serializers.IntegerField(min_value=1, max_value=9999)
    dimension_units = serializers.ChoiceField(choices=("CM", "IN"))
    customs_items = FedexCommoditySerializer(many=True, required=False, max_length=100)


class FedexRateSerializer(serializers.Serializer):
    ship_date = serializers.DateField()
    pickup_type = serializers.ChoiceField(
        choices=(
            "DROPOFF_AT_FEDEX_LOCATION",
            "CONTACT_FEDEX_TO_SCHEDULE",
            "USE_SCHEDULED_PICKUP",
        )
    )
    packaging_type = serializers.CharField(max_length=60)
    sender = FedexRateAddressSerializer()
    recipient = FedexRateAddressSerializer()
    packages = FedexRatePackageSerializer(many=True, allow_empty=False, max_length=40)

    def validate(self, attrs):
        origin = attrs["sender"]["country_code"].upper()
        destination = attrs["recipient"]["country_code"].upper()
        if origin == destination and origin != "US":
            raise serializers.ValidationError(
                {"detail": "FedEx doméstico solo aplica dentro de EE. UU. según la regla de GPC."}
            )
        if origin != destination:
            currencies = set()
            for package in attrs["packages"]:
                items = package.get("customs_items", [])
                if not items:
                    raise serializers.ValidationError(
                        {"packages": "Agrega los datos aduanales de cada paquete."}
                    )
                currencies.update(item["customs_currency"].upper() for item in items)
            if len(currencies) != 1:
                raise serializers.ValidationError(
                    {"packages": "Usa la misma moneda para todas las mercancías."}
                )
        return attrs

    def validate_packages(self, packages):
        if sum(package["quantity"] for package in packages) > 40:
            raise serializers.ValidationError("El máximo es 40 paquetes por consulta.")
        return packages


class FedexPartySerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=100)
    person_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=40)
    email_address = serializers.EmailField(required=False, allow_blank=True)
    street_lines = serializers.ListField(
        child=serializers.CharField(max_length=100),
        min_length=1,
        max_length=3,
    )
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=3, allow_blank=True)
    postal_code = serializers.CharField(max_length=20)
    country_code = serializers.RegexField(r"^[A-Za-z]{2}$")


class FedexSavedAddressSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    label = serializers.CharField(max_length=120)
    party = FedexPartySerializer()


class FedexNotificationRecipientSerializer(serializers.Serializer):
    email = serializers.EmailField(allow_blank=True)
    created = serializers.BooleanField()
    received = serializers.BooleanField()
    delivery_estimate = serializers.BooleanField()
    delivered = serializers.BooleanField()


class FedexNotificationPreferencesSerializer(serializers.Serializer):
    sender = FedexNotificationRecipientSerializer()
    recipient = FedexNotificationRecipientSerializer()
    other = FedexNotificationRecipientSerializer()
    requester = FedexNotificationRecipientSerializer()

    def validate_other(self, value):
        if value["email"].lower() != "uslogistics@globalpackcenter.com":
            raise serializers.ValidationError({"email": "El correo de Otro es fijo."})
        value["email"] = "uslogistics@globalpackcenter.com"
        return value

    def validate(self, attrs):
        for key, value in attrs.items():
            if not value["email"] and any(
                value[event] for event in ("created", "received", "delivery_estimate", "delivered")
            ):
                raise serializers.ValidationError(
                    {key: {"email": "Indica un correo para los avisos."}}
                )
        return attrs


class FedexPackageSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=999)
    weight = serializers.DecimalField(
        max_digits=10,
        decimal_places=3,
        min_value=Decimal("0.001"),
    )
    weight_units = serializers.ChoiceField(choices=("KG", "LB"))
    length = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    width = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    height = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )
    dimension_units = serializers.ChoiceField(choices=("CM", "IN"))
    customs_items = FedexCommoditySerializer(
        many=True,
        required=False,
        allow_empty=True,
        max_length=100,
    )


class FedexCreateShipmentSerializer(serializers.Serializer):
    cb_number = serializers.RegexField(r"^S\d{9}$")
    ship_date = serializers.DateField()
    service_type = serializers.CharField(max_length=60)
    pickup_type = serializers.ChoiceField(
        choices=(
            "DROPOFF_AT_FEDEX_LOCATION",
            "CONTACT_FEDEX_TO_SCHEDULE",
            "USE_SCHEDULED_PICKUP",
        )
    )
    packaging_type = serializers.CharField(max_length=60)
    payment_type = serializers.ChoiceField(choices=("SENDER", "RECIPIENT", "THIRD_PARTY"))
    payment_account_number = serializers.CharField(
        max_length=30, required=False, allow_blank=True
    )
    duties_account_number = serializers.CharField(
        max_length=30, required=False, allow_blank=True
    )
    duties_payment_type = serializers.ChoiceField(
        choices=("SENDER", "RECIPIENT", "THIRD_PARTY"), required=False
    )
    sender = FedexPartySerializer()
    recipient = FedexPartySerializer()
    packages = FedexPackageSerializer(many=True, allow_empty=False, max_length=40)
    commercial_invoice = serializers.CharField(required=False, max_length=1400000, write_only=True)
    invoice_reviewed = serializers.BooleanField(required=False, default=False)

    def validate_commercial_invoice(self, value):
        try:
            content = base64.b64decode(value, validate=True)
        except (ValueError, binascii.Error):
            raise serializers.ValidationError("La factura debe ser un PDF válido en base64.")
        if not content.startswith(b"%PDF-") or len(content) > 1024 * 1024:
            raise serializers.ValidationError("La factura debe ser un PDF de máximo 1 MB.")
        return content

    def validate(self, attrs):
        international = (
            attrs["sender"]["country_code"].upper()
            != attrs["recipient"]["country_code"].upper()
        )
        non_sender_payer = (
            attrs["payment_type"] != "SENDER" and not attrs.get("payment_account_number")
        )
        if non_sender_payer:
            raise serializers.ValidationError(
                {"payment_account_number": "Indica la cuenta FedEx que pagará el transporte."}
            )
        if (
            attrs.get("duties_payment_type") not in (None, "SENDER")
            and not attrs.get("duties_account_number")
        ):
            raise serializers.ValidationError(
                {"duties_account_number": "Indica la cuenta FedEx que pagará los cargos aduanales."}
            )

        if international:
            if not attrs.get("duties_payment_type"):
                raise serializers.ValidationError(
                    {"duties_payment_type": "Selecciona quién pagará los cargos aduanales."}
                )

            currencies = set()
            for index, package in enumerate(attrs["packages"]):
                if not package.get("customs_items"):
                    raise serializers.ValidationError(
                        {
                            "packages": {
                                index: "Agrega al menos una mercancía para la declaración aduanal."
                            }
                        }
                    )
                currencies.update(
                    item["customs_currency"].upper()
                    for item in package["customs_items"]
                )

            if len(currencies) != 1:
                raise serializers.ValidationError(
                    {"packages": "Usa la misma moneda para todas las mercancías."}
                )

        return attrs


class FedexEmailShipmentSerializer(serializers.Serializer):
    cb_number = serializers.RegexField(r"^S\d{9}$")
    tracking_number = serializers.CharField(max_length=40)
    recipient_email = serializers.EmailField()


class SkydropxTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=60)    