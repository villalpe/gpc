import base64
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import Membership, Role, User
from companies.models import Company
from integrations.models import FedexNotificationPreferences, FedexShipment, FedexShipmentLabel
from integrations.providers.fedex.client import FedexClient
from integrations.providers.fedex.mappers import (
    build_fedex_shipment_request,
    map_fedex_shipment,
)
from integrations.serializers import FedexCreateShipmentSerializer
from integrations.views import (
    FedexCreateShipmentView,
    FedexCreationNotificationRetryView,
    FedexEmailShipmentView,
    FedexShipmentHistoryView,
    FedexShipmentLabelView,
    FedexShipmentResolveView,
)


class FedexShipmentTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(legal_name="Company A", slug="company-a")
        self.user = User.objects.create_user(
            email="operator@example.test", password="test-password"
        )
        Membership.objects.create(
            user=self.user, company=self.company, role=Role.OPERATOR
        )
        self.headers = {"HTTP_X_COMPANY_ID": str(self.company.id)}
        self.payload = {
            "cb_number": "S123456789",
            "ship_date": date(2026, 11, 18),
            "service_type": "INTERNATIONAL_PRIORITY",
            "pickup_type": "DROPOFF_AT_FEDEX_LOCATION",
            "packaging_type": "YOUR_PACKAGING",
            "payment_type": "SENDER",
            "payment_account_number": "987654321",
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
                            "unit_price": Decimal("50.00"),
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
                            "unit_price": Decimal("25.00"),
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
        FEDEX_ACCOUNT_NUMBER="test-account",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    @patch("integrations.views.FedexClient.upload_commercial_invoice")
    def test_us_canada_uploads_invoice_before_creating_and_does_not_store_it(
        self, upload, create_shipment
    ):
        self.payload["sender"]["country_code"] = "US"
        self.payload["recipient"]["country_code"] = "CA"
        self.payload["duties_payment_type"] = "SENDER"
        self.payload["commercial_invoice"] = base64.b64encode(b"%PDF-1.4 example").decode()
        self.payload["invoice_reviewed"] = True
        upload.return_value = "document-123"
        create_shipment.return_value = {
            "output": {"transactionShipments": [{"pieceResponses": [{
                "trackingNumber": "123456789012",
                "packageDocuments": [{"encodedLabel": "JVBERi0xLjQ="}],
            }]}]}
        }

        def request():
            result = APIRequestFactory().post(
                "/api/integrations/fedex/shipments/", self.payload, format="json", **self.headers
            )
            force_authenticate(result, user=self.user)
            return result

        response = FedexCreateShipmentView.as_view()(request())
        self.assertEqual(response.status_code, 201)
        upload.assert_called_once_with(b"%PDF-1.4 example")
        shipment_request = create_shipment.call_args.args[0]["requestedShipment"]
        attached = shipment_request["shipmentSpecialServices"]["etdDetail"]["attachedDocuments"]
        self.assertEqual(attached, [{
            "documentType": "COMMERCIAL_INVOICE", "documentId": "document-123"
        }])
        self.assertNotIn("commercial_invoice", FedexShipment.objects.get().shipment_data)
        self.assertEqual(FedexCreateShipmentView.as_view()(request()).status_code, 409)
        upload.assert_called_once()
        create_shipment.assert_called_once()

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="test-account",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    @patch("integrations.views.FedexClient.upload_commercial_invoice", side_effect=ValueError())
    def test_invoice_upload_failure_never_creates_shipment(self, upload, create_shipment):
        self.payload["sender"]["country_code"] = "US"
        self.payload["recipient"]["country_code"] = "CA"
        self.payload["duties_payment_type"] = "SENDER"
        self.payload["commercial_invoice"] = base64.b64encode(b"%PDF-1.4 example").decode()
        self.payload["invoice_reviewed"] = True
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/", self.payload, format="json", **self.headers
        )
        force_authenticate(request, user=self.user)
        response = FedexCreateShipmentView.as_view()(request)
        self.assertEqual(response.status_code, 502)
        self.assertEqual(FedexShipment.objects.get().status, FedexShipment.Status.FAILED)
        upload.assert_called_once()
        create_shipment.assert_not_called()

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="test-account",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    @patch("integrations.views.FedexClient.upload_commercial_invoice")
    def test_requires_pdf_and_review_before_upload(self, upload, create_shipment):
        self.payload["sender"]["country_code"] = "US"
        self.payload["recipient"]["country_code"] = "CA"
        self.payload["duties_payment_type"] = "SENDER"

        def request():
            result = APIRequestFactory().post(
                "/api/integrations/fedex/shipments/", self.payload, format="json", **self.headers
            )
            force_authenticate(result, user=self.user)
            return FedexCreateShipmentView.as_view()(result)

        self.assertEqual(request().status_code, 400)
        self.payload["commercial_invoice"] = base64.b64encode(b"not a pdf").decode()
        self.payload["invoice_reviewed"] = True
        self.assertEqual(request().status_code, 400)
        self.payload["commercial_invoice"] = base64.b64encode(b"%PDF-1.4 example").decode()
        self.payload["invoice_reviewed"] = False
        self.assertEqual(request().status_code, 400)
        self.assertFalse(FedexShipment.objects.exists())
        upload.assert_not_called()
        create_shipment.assert_not_called()

    @override_settings(
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.providers.fedex.client.requests.post")
    @patch.object(FedexClient, "_get_token", return_value="token")
    def test_upload_invoice_uses_multipart_and_requires_document_id(self, _token, post):
        post.return_value.json.return_value = {"output": {"meta": {"docId": "doc-1"}}}
        self.assertEqual(FedexClient().upload_commercial_invoice(b"%PDF-example"), "doc-1")
        self.assertEqual(post.call_args.args[0],
                         "https://apis-sandbox.fedex.com/documents/v1/etds/upload")
        self.assertEqual([item[0] for item in post.call_args.kwargs["files"]],
                         ["document", "attachment"])
        post.return_value.json.return_value = {"output": {}}
        with self.assertRaises(ValueError):
            FedexClient().upload_commercial_invoice(b"%PDF-example")

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
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["sender"]["country_code"] = "US"
        self.payload["recipient"]["country_code"] = "US"
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(request, user=self.user)

        response = FedexCreateShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["tracking_number"], "123456789012")
        self.assertEqual(response.data["status"], FedexShipment.Status.CREATED)
        self.assertEqual(len(response.data["labels"]), 1)
        self.assertEqual(response.data["notification_status"], "not_requested")
        request_body = create_shipment.call_args.args[0]
        self.assertEqual(request_body["accountNumber"]["value"], "123456789")
        shipment = FedexShipment.objects.get(company=self.company, cb_number="S123456789")
        self.assertNotIn("payment_account_number", shipment.shipment_data)
        self.assertEqual(bytes(shipment.labels.get().content), b"%PDF-1.4")
        duplicate = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(duplicate, user=self.user)
        self.assertEqual(FedexCreateShipmentView.as_view()(duplicate).status_code, 409)
        create_shipment.assert_called_once()

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
        FEDEX_CREATION_NOTIFICATION_TEST_EMAIL="test-inbox@example.test",
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        EMAIL_HOST_USER="mailer@example.test",
        EMAIL_HOST_PASSWORD="test",
        DEFAULT_FROM_EMAIL="mailer@example.test",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_creation_notice_is_test_only_and_snapshot_is_persisted(self, create_shipment):
        create_shipment.return_value = {"output": {"transactionShipments": [{
            "pieceResponses": [{"trackingNumber": "123456789012",
                                "packageDocuments": [{"encodedLabel": "JVBERi0xLjQ="}]}]
        }]}}
        FedexNotificationPreferences.objects.create(
            company=self.company, cb_number="S123456789", preferences={
                "sender": {"email": "sender@example.com", "created": True},
                "recipient": {"email": "recipient@example.com", "created": True},
                "other": {"email": "other@example.com", "created": False},
                "requester": {"email": "requester@example.com", "created": False},
            },
        )
        self.payload["sender"]["country_code"] = "US"
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["packages"][0]["customs_items"] = []
        request = APIRequestFactory().post("/", self.payload, format="json", **self.headers)
        force_authenticate(request, user=self.user)
        response = FedexCreateShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["notification_status"], "sent")
        shipment = FedexShipment.objects.get(pk=response.data["id"])
        self.assertEqual(shipment.notification_groups, ["sender", "recipient"])
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["test-inbox@example.test"])
        self.assertEqual(mail.outbox[0].attachments, [])
        for value in ("S123456789", "123456789012", "GPC Sender", "Receiver", "FEDEX_2_DAY"):
            self.assertIn(value, mail.outbox[0].body)
        self.assertIn("Remitente, Destinatario", mail.outbox[0].body)

        retry = APIRequestFactory().post("/", {}, format="json", **self.headers)
        force_authenticate(retry, user=self.user)
        result = FedexCreationNotificationRetryView.as_view()(retry, shipment_id=shipment.id)
        self.assertEqual(result.status_code, 409)
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_CREATION_NOTIFICATION_TEST_EMAIL="test-inbox@example.test",
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
        EMAIL_HOST_USER="mailer@example.test",
        EMAIL_HOST_PASSWORD="test",
        DEFAULT_FROM_EMAIL="mailer@example.test",
    )
    def test_failed_notice_retry_is_scoped_and_never_recreates_shipment(self):
        shipment = FedexShipment.objects.create(
            company=self.company, cb_number="S123456789", created_by=self.user,
            status="created", ship_date=date(2026, 11, 18), service_type="FEDEX_2_DAY",
            pickup_type="DROPOFF_AT_FEDEX_LOCATION", tracking_number="123456789012",
            shipment_data={"sender": {"company_name": "A"}, "recipient": {"company_name": "B"}},
            notification_groups=["sender"], notification_status="pending",
        )
        def retry():
            request = APIRequestFactory().post("/", {}, format="json", **self.headers)
            force_authenticate(request, user=self.user)
            return FedexCreationNotificationRetryView.as_view()(request, shipment_id=shipment.id)

        with override_settings(FEDEX_BASE_URL="https://apis.fedex.com"):
            result = retry()
        self.assertEqual(result.data["notification_status"], "failed")
        self.assertIn("sandbox", result.data["notification_error"])
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)
        with override_settings(FEDEX_CREATION_NOTIFICATION_TEST_EMAIL="not-an-email"):
            result = retry()
        self.assertEqual(result.data["notification_status"], "failed")
        self.assertIn("no es válida", result.data["notification_error"])
        self.assertEqual(len(getattr(mail, "outbox", [])), 0)

        with patch(
            "integrations.fedex_notifications.EmailMessage.send", side_effect=OSError("test")
        ):
            response = retry()
        self.assertEqual(response.data["notification_status"], "failed")
        shipment.refresh_from_db()
        self.assertEqual(shipment.status, "created")
        self.assertEqual(retry().data["notification_status"], "sent")
        self.assertEqual(len(mail.outbox), 1)

        shipment.notification_status = "sending"
        shipment.notification_attempted_at = timezone.now()
        shipment.save()
        self.assertEqual(retry().status_code, 409)
        shipment.notification_attempted_at = timezone.now() - timedelta(minutes=6)
        shipment.save()
        self.assertEqual(retry().data["notification_status"], "sent")

        other = Company.objects.create(legal_name="Company B", slug="company-b")
        shipment.company = other
        shipment.save()
        self.assertEqual(retry().status_code, 404)

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
        FEDEX_CREATION_NOTIFICATION_TEST_EMAIL="",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_missing_test_inbox_does_not_prevent_creation(self, create_shipment):
        create_shipment.return_value = {"output": {"transactionShipments": [{
            "pieceResponses": [{"trackingNumber": "123456789012",
                                "packageDocuments": [{"encodedLabel": "JVBERi0xLjQ="}]}]
        }]}}
        FedexNotificationPreferences.objects.create(
            company=self.company, cb_number="S123456789",
            preferences={"sender": {"email": "sender@example.com", "created": True}},
        )
        self.payload["sender"]["country_code"] = "US"
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["packages"][0]["customs_items"] = []
        request = APIRequestFactory().post("/", self.payload, format="json", **self.headers)
        force_authenticate(request, user=self.user)
        response = FedexCreateShipmentView.as_view()(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "created")
        self.assertEqual(response.data["notification_status"], "failed")
        self.assertIn("dirección de prueba", response.data["notification_error"])
        self.assertTrue(FedexShipment.objects.get(pk=response.data["id"]).labels.exists())

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_timeout_marks_shipment_uncertain_and_blocks_retry(self, create_shipment):
        import requests

        create_shipment.side_effect = requests.Timeout
        self.payload["sender"]["country_code"] = "US"
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["packages"][0]["customs_items"] = []
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(request, user=self.user)
        response = FedexCreateShipmentView.as_view()(request)
        self.assertEqual(response.status_code, 504)
        self.assertEqual(
            FedexShipment.objects.get(company=self.company).status,
            FedexShipment.Status.UNCERTAIN,
        )

        retry = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(retry, user=self.user)
        self.assertEqual(FedexCreateShipmentView.as_view()(retry).status_code, 409)
        create_shipment.assert_called_once()

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_definite_rejection_is_recorded_and_allows_a_retry(self, create_shipment):
        import requests

        self.payload["sender"]["country_code"] = "US"
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["packages"][0]["customs_items"] = []
        rejected = requests.Response()
        rejected.status_code = 400
        rejected._content = b'{"errors":[{"code":"INVALID_REQUEST"}]}'
        created_response = {
            "output": {
                "transactionShipments": [
                    {
                        "pieceResponses": [
                            {
                                "trackingNumber": "123456789012",
                                "packageDocuments": [{"encodedLabel": "JVBERi0xLjQ="}],
                            }
                        ]
                    }
                ]
            }
        }
        create_shipment.side_effect = [
            requests.HTTPError(response=rejected),
            created_response,
        ]

        first = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(first, user=self.user)
        self.assertEqual(FedexCreateShipmentView.as_view()(first).status_code, 400)
        self.assertEqual(
            FedexShipment.objects.get(company=self.company).status,
            FedexShipment.Status.FAILED,
        )

        retry = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(retry, user=self.user)
        self.assertEqual(FedexCreateShipmentView.as_view()(retry).status_code, 201)
        self.assertEqual(
            FedexShipment.objects.filter(company=self.company, cb_number="S123456789").count(),
            2,
        )
        self.assertNotIn(
            "payment_account_number",
            FedexShipment.objects.filter(company=self.company)
            .order_by("created_at")
            .first()
            .shipment_data,
        )

    @override_settings(
        FEDEX_SHIPMENT_CREATION_ENABLED=True,
        FEDEX_ACCOUNT_NUMBER="123456789",
        FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
        FEDEX_API_KEY="test-key",
        FEDEX_SECRET_KEY="test-secret",
    )
    @patch("integrations.views.FedexClient.create_shipment")
    def test_creation_rejects_pickup_and_non_sandbox(self, create_shipment):
        self.payload["sender"]["country_code"] = "US"
        self.payload["service_type"] = "FEDEX_2_DAY"
        self.payload["packages"][0]["customs_items"] = []
        self.payload["pickup_type"] = "CONTACT_FEDEX_TO_SCHEDULE"
        pickup_request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(pickup_request, user=self.user)
        self.assertEqual(
            FedexCreateShipmentView.as_view()(pickup_request).status_code, 400
        )
        create_shipment.assert_not_called()

        self.payload["pickup_type"] = "DROPOFF_AT_FEDEX_LOCATION"
        self.company.is_active = False
        self.company.save(update_fields=["is_active"])
        inactive_company_request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/",
            self.payload,
            format="json",
            **self.headers,
        )
        force_authenticate(inactive_company_request, user=self.user)
        self.assertEqual(
            FedexCreateShipmentView.as_view()(inactive_company_request).status_code,
            403,
        )
        self.company.is_active = True
        self.company.save(update_fields=["is_active"])

        with override_settings(FEDEX_BASE_URL="https://apis.fedex.com"):
            production_request = APIRequestFactory().post(
                "/api/integrations/fedex/shipments/",
                self.payload,
                format="json",
                **self.headers,
            )
            force_authenticate(production_request, user=self.user)
            response = FedexCreateShipmentView.as_view()(production_request)
        self.assertEqual(response.status_code, 503)
        self.assertFalse(FedexShipment.objects.exists())
        create_shipment.assert_not_called()

    def test_history_and_label_download_are_company_scoped(self):
        shipment = FedexShipment.objects.create(
            company=self.company,
            cb_number="S123456789",
            created_by=self.user,
            status=FedexShipment.Status.CREATED,
            ship_date=date(2026, 11, 18),
            service_type="FEDEX_2_DAY",
            pickup_type="DROPOFF_AT_FEDEX_LOCATION",
            tracking_number="123456789012",
            tracking_numbers=["123456789012"],
            shipment_data={"sender": {"city": "Austin"}, "recipient": {"city": "Dallas"}},
        )
        label = FedexShipmentLabel.objects.create(
            shipment=shipment,
            file_name="S123456789-fedex-label-1.pdf",
            content=b"%PDF-1.4 test",
        )
        history_request = APIRequestFactory().get(
            "/api/integrations/fedex/shipments/", **self.headers
        )
        force_authenticate(history_request, user=self.user)
        history = FedexShipmentHistoryView.as_view()(history_request)
        self.assertEqual(len(history.data["shipments"]), 1)
        self.assertNotIn("content", history.data["shipments"][0]["labels"][0])

        label_request = APIRequestFactory().get(
            f"/api/integrations/fedex/shipments/labels/{label.id}/",
            **self.headers,
        )
        force_authenticate(label_request, user=self.user)
        downloaded = FedexShipmentLabelView.as_view()(label_request, label_id=label.id)
        self.assertEqual(downloaded.status_code, 200)
        self.assertEqual(downloaded.content, b"%PDF-1.4 test")

        other = Company.objects.create(legal_name="Company B", slug="company-b")
        Membership.objects.create(user=self.user, company=other, role=Role.OPERATOR)
        other_headers = {"HTTP_X_COMPANY_ID": str(other.id)}
        cross_company_request = APIRequestFactory().get(
            f"/api/integrations/fedex/shipments/labels/{label.id}/",
            **other_headers,
        )
        force_authenticate(cross_company_request, user=self.user)
        denied = FedexShipmentLabelView.as_view()(cross_company_request, label_id=label.id)
        self.assertEqual(denied.status_code, 404)

    def test_only_company_admin_can_resolve_uncertain_shipment(self):
        shipment = FedexShipment.objects.create(
            company=self.company,
            cb_number="S123456789",
            created_by=self.user,
            status=FedexShipment.Status.UNCERTAIN,
            ship_date=date(2026, 11, 18),
            service_type="FEDEX_2_DAY",
            pickup_type="DROPOFF_AT_FEDEX_LOCATION",
            shipment_data={},
        )
        payload = {
            "action": "confirm_not_created",
            "note": "Verificado en la cuenta de FedEx.",
        }
        request = APIRequestFactory().post(
            f"/api/integrations/fedex/shipments/{shipment.id}/resolve/",
            payload,
            format="json",
            **self.headers,
        )
        force_authenticate(request, user=self.user)
        self.assertEqual(
            FedexShipmentResolveView.as_view()(request, shipment_id=shipment.id).status_code,
            403,
        )

        Membership.objects.filter(user=self.user, company=self.company).update(
            role=Role.ADMIN_COMPANY
        )
        admin_request = APIRequestFactory().post(
            f"/api/integrations/fedex/shipments/{shipment.id}/resolve/",
            payload,
            format="json",
            **self.headers,
        )
        force_authenticate(admin_request, user=self.user)
        response = FedexShipmentResolveView.as_view()(
            admin_request, shipment_id=shipment.id
        )
        self.assertEqual(response.status_code, 200)
        shipment.refresh_from_db()
        self.assertEqual(shipment.status, FedexShipment.Status.FAILED)
        self.assertEqual(shipment.resolved_by, self.user)
        self.assertTrue(shipment.resolved_at)

    def test_processing_cannot_be_resolved_while_creation_may_still_be_running(self):
        Membership.objects.filter(user=self.user, company=self.company).update(
            role=Role.ADMIN_COMPANY
        )
        shipment = FedexShipment.objects.create(
            company=self.company,
            cb_number="S123456789",
            created_by=self.user,
            status=FedexShipment.Status.PROCESSING,
            ship_date=date(2026, 11, 18),
            service_type="FEDEX_2_DAY",
            pickup_type="DROPOFF_AT_FEDEX_LOCATION",
            shipment_data={},
        )
        request = APIRequestFactory().post(
            f"/api/integrations/fedex/shipments/{shipment.id}/resolve/",
            {"action": "confirm_not_created", "note": "Revisado"},
            format="json",
            **self.headers,
        )
        force_authenticate(request, user=self.user)
        response = FedexShipmentResolveView.as_view()(request, shipment_id=shipment.id)
        self.assertEqual(response.status_code, 404)
        shipment.refresh_from_db()
        self.assertEqual(shipment.status, FedexShipment.Status.PROCESSING)

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
        }
        shipment = FedexShipment.objects.create(
            company=self.company,
            cb_number=payload["cb_number"],
            created_by=self.user,
            status=FedexShipment.Status.CREATED,
            ship_date=date(2026, 11, 18),
            service_type="FEDEX_2_DAY",
            pickup_type="DROPOFF_AT_FEDEX_LOCATION",
            tracking_number=payload["tracking_number"],
            tracking_numbers=[payload["tracking_number"]],
            shipment_data={},
        )
        FedexShipmentLabel.objects.create(
            shipment=shipment,
            file_name="S123456789-fedex-label-1.pdf",
            content=b"%PDF-1.4 test",
        )
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/",
            payload,
            format="json",
            **self.headers,
        )
        force_authenticate(request, user=self.user)

        response = FedexEmailShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["requestor@example.com"])
        self.assertEqual(mail.outbox[0].attachments[0][0], "S123456789-fedex-label-1.pdf")

        payload["recipient_email"] = "another@example.com"
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/", payload, format="json", **self.headers
        )
        force_authenticate(request, user=self.user)
        self.assertEqual(FedexEmailShipmentView.as_view()(request).status_code, 200)
        self.assertEqual(mail.outbox[1].to, ["another@example.com"])
        self.assertEqual(mail.outbox[1].attachments[0][1], b"%PDF-1.4 test")

        other = Company.objects.create(legal_name="Company B", slug="company-b")
        shipment.company = other
        shipment.save()
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/", payload, format="json", **self.headers
        )
        force_authenticate(request, user=self.user)
        self.assertEqual(FedexEmailShipmentView.as_view()(request).status_code, 404)
        self.assertEqual(len(mail.outbox), 2)

    @override_settings(FEDEX_SHIPMENT_CREATION_ENABLED=False)
    @patch("integrations.views.FedexClient.create_shipment")
    def test_creation_is_disabled_for_review(self, create_shipment):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/", {}, format="json", **self.headers
        )
        force_authenticate(request, user=self.user)

        response = FedexCreateShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        create_shipment.assert_not_called()

    @override_settings(FEDEX_SHIPMENT_CREATION_ENABLED=False)
    @patch("integrations.views.EmailMessage.send")
    def test_email_is_disabled_for_review(self, send):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/shipments/email/", {}, format="json", **self.headers
        )
        force_authenticate(request, user=self.user)

        response = FedexEmailShipmentView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        send.assert_not_called()
