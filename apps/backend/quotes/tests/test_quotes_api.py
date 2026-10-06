from unittest import mock

from rest_framework.test import APITestCase

from accounts.models import Membership, Role, User
from companies.models import Company
from integrations.providers.skydropx.client import SkydropxAPIError, SkydropxTimeoutError
from integrations.tests.test_skydropx_quotations import make_rate  # noqa: I001
from quotes.models import QuoteRequest

BODY = {
    "origin": {
        "country_code": "MX",
        "postal_code": "64000",
        "state": "Nuevo León",
        "city": "Monterrey",
        "area": "Centro",
    },
    "destination": {
        "country_code": "MX",
        "postal_code": "44100",
        "state": "Jalisco",
        "city": "Guadalajara",
        "area": "Americana",
    },
    "parcels": [{"length": 30, "width": 20, "height": 15, "weight": 2.5}],
}

RAW = {
    "id": "q1",
    "is_completed": True,
    "rates": [make_rate(), make_rate(id="r2", packaging_type="Pallet"), make_rate(success=False)],
}


def has_price_keys(obj):
    if isinstance(obj, dict):
        if {"price", "price_breakdown", "total_value_with_protection"} & set(obj):
            return True
        return any(has_price_keys(v) for v in obj.values())
    if isinstance(obj, list):
        return any(has_price_keys(v) for v in obj)
    return False


class QuotesAPITests(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(legal_name="A", slug="a")
        self.other = Company.objects.create(legal_name="B", slug="b")
        self.users = {}
        for role in Role.values:
            u = User.objects.create_user(f"{role.lower()}@x.com", "Test1234!")
            Membership.objects.create(user=u, company=self.company, role=role)
            self.users[Role(role)] = u
        self.outsider = User.objects.create_user("out@x.com", "Test1234!")
        Membership.objects.create(user=self.outsider, company=self.other, role=Role.ADMIN_COMPANY)

    def _as(self, user, company=None):
        self.client.force_authenticate(user)
        self.client.credentials(HTTP_X_COMPANY_ID=str((company or self.company).id))

    def _post(self, body):
        return self.client.post("/api/quotes/skydropx/", body, format="json")

    def _create(self, user):
        self._as(user)
        with mock.patch("quotes.views.SkydropxClient") as cls:
            cls.return_value.create_quotation.return_value = {"id": "q1"}
            cls.return_value.poll_quotation_until_completed.return_value = RAW
            return self.client.post("/api/quotes/skydropx/", BODY, format="json")

    def test_staff_roles_receive_price(self):
        for role in (Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR):
            res = self._create(self.users[role])
            self.assertEqual(res.status_code, 201, res.data)
            opts = res.data["data"]["options"]
            self.assertEqual(len(opts["parcel"]), 1)
            self.assertEqual(len(opts["freight"]), 1)
            self.assertIn("price", opts["parcel"][0])
            self.assertIn("price_breakdown", opts["parcel"][0])

    def test_client_and_viewer_never_receive_price(self):
        for role in (Role.CLIENT, Role.VIEWER):
            res = self._create(self.users[role])
            self.assertEqual(res.status_code, 201, res.data)
            self.assertFalse(has_price_keys(res.data), role)
            qid = res.data["data"]["id"]
            for url in ("/api/quotes/latest/", "/api/quotes/history/", f"/api/quotes/{qid}/"):
                r = self.client.get(url)
                self.assertEqual(r.status_code, 200)
                self.assertFalse(has_price_keys(r.data), url)

    def test_snapshot_stored_with_prices_and_detail_url(self):
        res = self._create(self.users[Role.OPERATOR])
        qid = res.data["data"]["id"]
        self.assertEqual(QuoteRequest.objects.get(id=qid).result_options[0]["price"], "150.50")
        self.assertEqual(QuoteRequest.objects.get(id=qid).parcels.count(), 1)
        r = self.client.get(f"/api/quotes/{qid}/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("price", r.data["data"]["options"]["parcel"][0])

    def test_unauthenticated_is_401(self):
        for url in ("/api/quotes/latest/", "/api/quotes/history/", "/api/quotes/1/",
                    "/api/quotes/customers/"):
            self.assertEqual(self.client.get(url).status_code, 401, url)
        res = self.client.post("/api/quotes/skydropx/", BODY, format="json")
        self.assertEqual(res.status_code, 401)

    def test_tenant_isolation(self):
        res = self._create(self.users[Role.ADMIN_COMPANY])
        qid = res.data["data"]["id"]
        self._as(self.outsider, self.other)
        self.assertEqual(self.client.get(f"/api/quotes/{qid}/").status_code, 404)
        self.assertEqual(self.client.get("/api/quotes/history/").data["data"], [])
        self.assertEqual(self.client.get("/api/quotes/latest/").status_code, 404)
        # not a member of the company -> denied
        self._as(self.outsider, self.company)
        self.assertEqual(self.client.get(f"/api/quotes/{qid}/").status_code, 403)

    def test_validation_errors(self):
        self._as(self.users[Role.OPERATOR])
        bad = dict(BODY, parcels=[])
        self.assertEqual(self._post(bad).status_code, 400)
        bad = dict(BODY, parcels=[{"length": 0, "width": 1, "height": 1, "weight": 1}])
        self.assertEqual(self._post(bad).status_code, 400)
        bad = dict(BODY, origin=dict(BODY["origin"], country_code="US"))
        self.assertEqual(self._post(bad).status_code, 400)

    def test_requested_carriers_omitted_when_empty(self):
        self._as(self.users[Role.OPERATOR])
        with mock.patch("quotes.views.SkydropxClient") as cls:
            cls.return_value.create_quotation.return_value = {"id": "q1"}
            cls.return_value.poll_quotation_until_completed.return_value = RAW
            self.client.post("/api/quotes/skydropx/", BODY, format="json")
            payload = cls.return_value.create_quotation.call_args[0][0]
        self.assertNotIn("requested_carriers", payload["quotation"])
        self.assertEqual(payload["quotation"]["address_from"]["area_level2"], "Monterrey")

    def test_provider_errors(self):
        self._as(self.users[Role.OPERATOR])
        for exc, code in ((SkydropxTimeoutError("x"), 504), (SkydropxAPIError("secret"), 502)):
            with mock.patch("quotes.views.SkydropxClient") as cls:
                cls.return_value.create_quotation.return_value = {"id": "q1"}
                cls.return_value.poll_quotation_until_completed.side_effect = exc
                res = self.client.post("/api/quotes/skydropx/", BODY, format="json")
            self.assertEqual(res.status_code, code)
            self.assertNotIn("secret", str(res.data))
