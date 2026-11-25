from types import SimpleNamespace
from unittest.mock import patch

import requests
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from integrations.providers.fedex.rates import build_rate_request, normalize_rate_response
from integrations.serializers import FedexRateSerializer
from integrations.views import FedexRatesView


@override_settings(
    FEDEX_ACCOUNT_NUMBER="test-account",
    FEDEX_API_KEY="test-key",
    FEDEX_SECRET_KEY="test-secret",
    FEDEX_BASE_URL="https://apis-sandbox.fedex.com",
)
class FedexRateTests(SimpleTestCase):
    def setUp(self):
        self.payload = {
            "ship_date": "2026-11-18",
            "pickup_type": "DROPOFF_AT_FEDEX_LOCATION",
            "packaging_type": "YOUR_PACKAGING",
            "sender": {"country_code": "US", "postal_code": "75063"},
            "recipient": {"country_code": "US", "postal_code": "10001"},
            "packages": [{
                "quantity": 2, "weight": "2", "weight_units": "LB",
                "length": 10, "width": 8, "height": 4, "dimension_units": "IN",
            }],
        }
        self.raw = {
            "output": {
                "rateReplyDetails": [{
                    "serviceType": "FEDEX_2_DAY",
                    "serviceName": "FedEx 2Day",
                    "ratedShipmentDetails": [
                        {"rateType": "LIST", "totalNetCharge": 99, "currency": "USD"},
                        {"rateType": "ACCOUNT", "totalNetCharge": 44.25, "currency": "USD"},
                    ],
                    "commit": {"dateDetail": {"dayCxsFormat": "2026-11-20T17:00:00"}},
                }]
            }
        }

    def request(self):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/rates/", self.payload, format="json"
        )
        force_authenticate(request, user=SimpleNamespace(is_authenticated=True))
        return request

    def test_request_has_each_package_and_no_service_filter(self):
        serializer = FedexRateSerializer(data=self.payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        payload = build_rate_request(serializer.validated_data, "test-account")
        shipment = payload["requestedShipment"]
        self.assertEqual(len(shipment["requestedPackageLineItems"]), 2)
        self.assertEqual(shipment["pickupType"], "DROPOFF_AT_FEDEX_LOCATION")
        self.assertEqual(shipment["packagingType"], "YOUR_PACKAGING")
        self.assertNotIn("serviceType", shipment)
        self.assertEqual(shipment["rateRequestType"], ["ACCOUNT"])
        self.assertNotIn("customsClearanceDetail", shipment)
        self.assertTrue(payload["rateRequestControlParameters"]["returnTransitTimes"])

    def test_international_rate_requires_and_maps_actual_customs(self):
        self.payload["recipient"]["country_code"] = "CA"
        self.payload["recipient"]["state"] = "ON"
        serializer = FedexRateSerializer(data=self.payload)
        self.assertFalse(serializer.is_valid())
        self.payload["packages"][0]["customs_items"] = [{
            "description": "Steel part", "hs_code": "123456", "origin_country": "US",
            "quantity": 2, "weight": "2", "weight_units": "LB",
            "unit_price": "25.00", "customs_value": "50.00", "customs_currency": "USD",
        }]
        serializer = FedexRateSerializer(data=self.payload)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        requested = build_rate_request(serializer.validated_data, "test-account")
        shipment = requested["requestedShipment"]
        customs = shipment["customsClearanceDetail"]
        self.assertEqual(shipment["recipient"]["address"]["stateOrProvinceCode"], "ON")
        self.assertEqual(customs["totalCustomsValue"], {"amount": 50.0, "currency": "USD"})
        self.assertEqual(customs["commodities"][0]["unitPrice"]["amount"], 25.0)
        self.assertEqual(customs["commodities"][0]["harmonizedCode"], "123456")

    def test_normalizes_account_price_and_estimate(self):
        rate = normalize_rate_response(self.raw)[0]
        self.assertEqual(rate["amount"], 44.25)
        self.assertEqual(rate["currency"], "USD")
        self.assertEqual(rate["delivery_date"], "2026-11-20T17:00:00")

    def test_billable_weight_uses_fedex_account_response(self):
        account = self.raw["output"]["rateReplyDetails"][0]["ratedShipmentDetails"][1]
        account["ratedWeightMethod"] = "DIM"
        account["shipmentRateDetail"] = {"totalBillingWeight": {"value": 8, "units": "LB"}}
        rate = normalize_rate_response(self.raw)[0]
        self.assertEqual(rate["billing_weight"], 8)
        self.assertEqual(rate["billing_weight_units"], "LB")
        self.assertEqual(rate["rated_weight_method"], "DIM")

    def test_does_not_replace_missing_account_price_with_list_price(self):
        self.raw["output"]["rateReplyDetails"][0]["ratedShipmentDetails"].pop()
        self.assertIsNone(normalize_rate_response(self.raw)[0]["amount"])

    def test_handles_unexpected_response_field_types(self):
        entry = self.raw["output"]["rateReplyDetails"][0]
        entry["serviceName"] = {"name": "FedEx 2Day"}
        entry["ratedShipmentDetails"][1]["totalNetCharge"] = "invalid"
        entry["ratedShipmentDetails"][1]["currency"] = {"code": "USD"}
        rate = normalize_rate_response(self.raw)[0]
        self.assertEqual(rate["service_name"], "FEDEX_2_DAY")
        self.assertIsNone(rate["amount"])
        self.assertIsNone(rate["currency"])

    def test_rejects_bad_dimensions_and_non_us_domestic(self):
        self.payload["packages"][0]["length"] = "10.5"
        serializer = FedexRateSerializer(data=self.payload)
        self.assertFalse(serializer.is_valid())
        self.payload["packages"][0]["length"] = 10
        self.payload["sender"]["country_code"] = "MX"
        self.payload["recipient"]["country_code"] = "MX"
        self.assertFalse(FedexRateSerializer(data=self.payload).is_valid())

    def test_rejects_more_than_40_physical_packages(self):
        self.payload["packages"][0]["quantity"] = 41
        self.assertFalse(FedexRateSerializer(data=self.payload).is_valid())

    @patch("integrations.views.CanAccessQuotes.has_permission", return_value=True)
    @patch("integrations.views.get_active_company_id", return_value="company")
    @patch("integrations.views.can_view_price", return_value=True)
    @patch("integrations.views.FedexClient.rates")
    def test_endpoint_returns_rates_without_creating_shipment(
        self, rate, _price, _company, _access
    ):
        rate.return_value = self.raw
        response = FedexRatesView.as_view()(self.request())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["rates"][0]["amount"], 44.25)
        self.assertNotIn("test-account", str(response.data))
        rate.assert_called_once()

    @patch("integrations.views.CanAccessQuotes.has_permission", return_value=True)
    @patch("integrations.views.get_active_company_id", return_value="company")
    @patch("integrations.views.can_view_price", return_value=False)
    @patch("integrations.views.FedexClient.rates")
    def test_price_permission_required(self, rate, _price, _company, _access):
        response = FedexRatesView.as_view()(self.request())
        self.assertEqual(response.status_code, 403)
        rate.assert_not_called()

    @patch("integrations.views.CanAccessQuotes.has_permission", return_value=True)
    @patch("integrations.views.get_active_company_id", return_value="company")
    @patch("integrations.views.can_view_price", return_value=True)
    @patch("integrations.views.FedexClient.rates", side_effect=requests.Timeout())
    def test_timeout_is_not_a_success(self, _rate, _price, _company, _access):
        response = FedexRatesView.as_view()(self.request())
        self.assertEqual(response.status_code, 504)

    @override_settings(FEDEX_BASE_URL="https://apis.fedex.com")
    @patch("integrations.views.CanAccessQuotes.has_permission", return_value=True)
    @patch("integrations.views.get_active_company_id", return_value="company")
    @patch("integrations.views.can_view_price", return_value=True)
    @patch("integrations.views.FedexClient.rates")
    def test_production_endpoint_is_not_called(self, rate, _price, _company, _access):
        response = FedexRatesView.as_view()(self.request())
        self.assertEqual(response.status_code, 503)
        rate.assert_not_called()

    def test_authentication_is_required(self):
        request = APIRequestFactory().post(
            "/api/integrations/fedex/rates/", self.payload, format="json"
        )
        response = FedexRatesView.as_view()(request)
        self.assertEqual(response.status_code, 401)
