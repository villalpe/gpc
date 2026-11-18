import base64
from datetime import date
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch

from django.core import mail
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from integrations.providers.fedex.mappers import (
    build_fedex_shipment_request,
    map_fedex_shipment,
)
from integrations.serializers import FedexCreateShipmentSerializer
from integrations.views import FedexCreateShipmentView, FedexEmailShipmentView


class FedexShipmentTests(SimpleTestCase):
    def setUp(self):
        self.payload = {
            "cb_number": "S123456789",
            "ship_date": date(2026, 11, 18),
            "service_type": "INTERNATIONAL_PRIORITY",
            "pickup_type": "DROPOFF_AT_FEDEX_LOCATION",
            "packaging_type": "YOUR_PACKAGING",
            "payment_type": "SENDER",
            "sender": {
                "company_name": "GPC Sender",
                "person_name": "Sender Contact",
                "phone_number": "5555555555",
                "email_address": "sender@example.com",
                "street_lines": ["1 Sender Street"],
                "city": "Mexico City",
                "state": "CMX",
                "postal_code": "01000",
                "country_code": "MX",
            },
            "recipient": {
                "company_name": "Receiver",
                "person_name": "Receiver Contact",
                "phone_number": "5555555556",
                "email_address": "receiver@example.com",
                "street_lines": ["2 Receiver Street"],
                "city": "Austin",
                "state": "TX",
                "postal_code": "78701",
                "country_code": "US",
            },
            "packages": [
                {
                    "quantity": 2,
                    "weight": Decimal("1.250"),
                    "weight_units": "KG",
                    "length": Decimal("20"),
                    "width": Decimal("15"),
                    "height": Decimal("10"),
                    "dimension_units": "CM",
                    "customs_items": [
                        {
                            "description": "Test merchandise",
                            "hs_code": "123456",
                            "origin_country": "MX",
                            "quantity": 2,
                            "weight": Decimal("1.250"),
                            "weight_units": "KG",
                            "customs_value": Decimal("100.00"),
                            "customs_currency": "USD",
                        },
                        {
                            "description": "Accessory",
                            "hs_code": "654321",
                            "origin_country": "US",
                            "quantity": 1,
                            "weight": Decimal("0.250"),
                            "weight_units": "KG",
                            "customs_value": Decimal("25.00"),
                            "customs_currency": "USD",
                        },
                    ],
                }
            ],
        }

    def test_builds_international_fedex_shipment_and_customs_data(self):
        self.payload["duties_payment_type"] = "SENDER"
        serializer = FedexCreateShipmentSerializer(data=self.payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        request = build_fedex_shipment_request(
            serializer.validated_data,
            "123456789",
        )
        requested = request["requestedShipment"]

        self.assertEqual(requested["serviceType"], "INTERNATIONAL_PRIORITY")
        self.assertEqual(requested["totalPackageCount"], 2)
        self.assertEqual(requested["requestedPackageLineItems"][0]["weight"]["value"], 1.25)
        self.assertEqual(
            requested["customsClearanceDetail"]["commodities"][0]["harmonizedCode"],
            "123456",
        )
        self.assertEqual(
            len(requested["customsClearanceDetail"]["commodities"]),
            2,
        )
        self.assertEqual(
            requested["customsClearanceDetail"]["totalCustomsValue"]["amount"],
            125.0,
        )

    def test_requires_customs_details_for_international_shipment(self):
        self.payload.pop("packages")
        package = {
            "quantity": 1,
            "weight": "1",
            "weight_units": "KG",
            "length": "10",
            "width": "10",
            "height": "10",
            "dimension_units": "CM",
            "customs_items": [],
        }
        self.payload["packages"] = [package]
        self.payload["duties_payment_type"] = "SENDER"
        serializer = FedexCreateShipmentSerializer(data=self.payload)

        self.assertFalse(serializer.is_valid())
        self.assertIn("packages", serializer.errors)

    def test_maps_fedex_tracking_number_and_pdf_label(self):
        response = map_fedex_shipment(
            {
                "output": {
                    "transactionShipments": [
                        {
                            "pieceResponses": [
                                {
                                    "trackingNumber": "123456789012",
                                    "packageDocuments": [
                                        {
                                            "encodedLabel": "JVBERi0xLjQ=",
                                            "contentType": "LABEL",
                                        }
                                    ],
                                }
                            ]
                        }
                    ]
                }
            },
            "S123456789",
        )

        self.assertEqual(response["tracking_number"], "123456789012")
        self.assertEqual(response["labels"][0]["content_base64"], "JVBERi0xLjQ=")
        self.assertEqual(response["warning"], "")

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_create_view_uses_backend_fedex_account(self, create_shipment):
        create_shipment.return_value = {
            "output": {
                "transactionShipments": [
                    {
                        "pieceResponses": [
                            {
                                "trackingNumber": "123456789012",
                                "packageDocuments": [
                                    {
                                        "encodedLabel": "JVBERi0xLjQ=",
                                        "contentType": "LABEL",
                                    }
                                ],
                            }
                        ]
                    }
                ]
            }
        }
        self.payload["packages"][0]["customs_items"] = []
        self.payload["sender"]["country_code"] = "US"
        self.payload["recipient"]["country_code"] = "US"
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
        )
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))

        response = FedexCreateShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["tracking_number"], "123456789012")
        request_body = create_shipment.call_args.args[0]
        self.assertEqual(request_body["accountNumber"]["value"], "123456789")

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        EMAIL_HOST_USER="gpc@example.com",
        EMAIL_HOST_PASSWORD="app-password",
        DEFAULT_FROM_EMAIL="gpc@example.com",
    )
    def test_email_view_sends_the_verified_pdf_to_requested_address(self):
        payload = {
            "cb_number": "S123456789",
            "tracking_number": "123456789012",
            "recipient_email": "requestor@example.com",
            "labels": [
                {
                    "file_name": "client-supplied-name.pdf",
                    "content_base64": base64.b64encode(b"%PDF-1.4 test").decode(),
                }
            ],
        }
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/",
            payload,
            format="json",
        )
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))

        response = FedexEmailShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["requestor@example.com"])
        self.assertEqual(mail.outbox[0].attachments[0][0], "S123456789-fedex-label-1.pdf")

    @override_settings(FEDEX_SHIPMENT_CREATION_ENABLED=False)
    @patch("integrations.views.FedexClient.create_shipment")
    def test_creation_is_disabled_for_review(self, create_shipment):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/", {}, format="json"
        )
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))

        response = FedexCreateShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        create_shipment.assert_not_called()

    @override_settings(FEDEX_SHIPMENT_CREATION_ENABLED=False)
    @patch("integrations.views.EmailMessage.send")
    def test_email_is_disabled_for_review(self, send):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/", {}, format="json"
        )
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))

        response = FedexEmailShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        send.assert_not_called()
