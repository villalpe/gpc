from decimal import Decimal
from unittest import mock

from django.test import SimpleTestCase, override_settings

from integrations.providers.skydropx.client import (
    SkydropxAPIError,
    SkydropxClient,
    SkydropxTimeoutError,
)
from integrations.providers.skydropx.mappers import map_quotation_rates, map_rate


def make_rate(**overrides):
    rate = {
        "id": "r1",
        "success": True,
        "status": "approved",
        "provider_display_name": "Estafeta",
        "provider_name": "estafeta",
        "provider_service_name": "Terrestre",
        "provider_service_code": "ground",
        "days": 3,
        "pickup": True,
        "office_pickup": False,
        "office_delivery": False,
        "packaging_type": "Package",
        "requires_origin_verification": False,
        "total": "150.50",
        "amount": "120.00",
        "vat_fee": "19.20",
        "service_fee": None,
        "extra_fees": [],
        "currency_code": "MXN",
        "total_value_with_protection": "160.00",
    }
    rate.update(overrides)
    return rate


class MapRateTests(SimpleTestCase):
    def test_filters_unsuccessful_rates(self):
        self.assertIsNone(map_rate(make_rate(success=False)))
        self.assertIsNone(map_rate(make_rate(status="no_coverage")))
        raw = {"rates": [make_rate(), make_rate(success=False), make_rate(status="pending")]}
        self.assertEqual(len(map_quotation_rates(raw)), 1)

    def test_accepted_statuses(self):
        for st in ("approved", "price_found_internal", "price_found_external"):
            self.assertIsNotNone(map_rate(make_rate(status=st)))

    def test_decimal_conversion_and_none(self):
        r = map_rate(make_rate(total=None))
        self.assertIsNone(r["price"])
        r = map_rate(make_rate())
        self.assertEqual(r["price"], Decimal("150.50"))
        self.assertEqual(r["price_breakdown"]["vat_fee"], Decimal("19.20"))
        self.assertIsNone(r["price_breakdown"]["service_fee"])
        self.assertEqual(r["total_value_with_protection"], Decimal("160.00"))

    def test_pickup_and_delivery(self):
        r = map_rate(make_rate(pickup=True, office_pickup=False, office_delivery=False))
        self.assertEqual(r["pickup_type"], "pickup")
        self.assertEqual(r["delivery_type"], "home")
        r = map_rate(make_rate(pickup=False, office_pickup=True, office_delivery=True))
        self.assertEqual(r["pickup_type"], "dropoff")
        self.assertTrue(r["office_pickup_available"])
        self.assertFalse(r["pickup_available"])
        self.assertEqual(r["delivery_type"], "ocurre")

    def test_mode_split_and_fields(self):
        self.assertEqual(map_rate(make_rate())["mode"], "parcel")
        self.assertEqual(map_rate(make_rate(packaging_type="Pallet"))["mode"], "freight")
        r = map_rate(make_rate())
        self.assertIsNone(r["fulfillment_level"])
        self.assertEqual(r["rate_id"], "r1")
        self.assertEqual(r["carrier"], "Estafeta")
        self.assertEqual(r["carrier_code"], "estafeta")
        self.assertEqual(r["service_code"], "ground")
        self.assertEqual(r["estimated_days"], 3)


def resp(status=200, body=None):
    m = mock.Mock()
    m.status_code = status
    m.ok = status < 400
    m.json.return_value = body if body is not None else {}
    return m


@override_settings(
    SKYDROPX_BASE_URL="https://example.test",
    SKYDROPX_API_KEY="k",
    SKYDROPX_SECRET_KEY="s",
    SKYDROPX_TIMEOUT_SECONDS=5,
)
class ClientQuotationTests(SimpleTestCase):
    def setUp(self):
        self.client = SkydropxClient()
        self.client._token = "tok"

    @mock.patch("integrations.providers.skydropx.client.time.sleep")
    @mock.patch("integrations.providers.skydropx.client.requests.request")
    def test_create_and_poll_completes(self, req, sleep):
        req.side_effect = [
            resp(201, {"id": "q1"}),
            resp(200, {"id": "q1", "is_completed": False}),
            resp(200, {"id": "q1", "is_completed": True, "rates": []}),
        ]
        created = self.client.create_quotation({"quotation": {}})
        self.assertEqual(created["id"], "q1")
        done = self.client.poll_quotation_until_completed("q1", timeout=30, interval=0.01)
        self.assertTrue(done["is_completed"])
        self.assertEqual(req.call_args_list[0][0], ("POST", "https://example.test/api/v1/quotations"))
        self.assertEqual(sleep.call_count, 1)

    @mock.patch("integrations.providers.skydropx.client.time.sleep")
    @mock.patch("integrations.providers.skydropx.client.requests.request")
    def test_poll_timeout(self, req, sleep):
        req.return_value = resp(200, {"is_completed": False})
        with self.assertRaises(SkydropxTimeoutError):
            self.client.poll_quotation_until_completed("q1", timeout=0.05, interval=0.1)

    @mock.patch("integrations.providers.skydropx.client.requests.post")
    @mock.patch("integrations.providers.skydropx.client.requests.request")
    def test_401_refreshes_token_once(self, req, post):
        post.return_value = resp(200, {"access_token": "new"})
        req.side_effect = [resp(401), resp(200, {"id": "q1"})]
        out = self.client.get_quotation("q1")
        self.assertEqual(out["id"], "q1")
        self.assertEqual(post.call_count, 1)
        self.assertEqual(req.call_count, 2)
        self.assertEqual(self.client._token, "new")

    @mock.patch("integrations.providers.skydropx.client.requests.post")
    @mock.patch("integrations.providers.skydropx.client.requests.request")
    def test_repeated_401_raises(self, req, post):
        post.return_value = resp(200, {"access_token": "new"})
        req.return_value = resp(401)
        with self.assertRaises(SkydropxAPIError):
            self.client.get_quotation("q1")
        self.assertEqual(req.call_count, 2)
