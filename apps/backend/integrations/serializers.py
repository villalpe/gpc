from decimal import Decimal

from rest_framework import serializers


class FedexTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=50)


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
    customs_value = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0"),
    )
    customs_currency = serializers.RegexField(r"^[A-Za-z]{3}$")


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
    labels = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=40,
    )


class SkydropxTrackRequestSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=60)    