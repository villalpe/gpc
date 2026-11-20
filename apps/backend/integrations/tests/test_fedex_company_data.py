from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Membership, Role, User
from companies.models import Company


class FedexCompanyDataTests(TestCase):
    def setUp(self):
        self.company = Company.objects.create(legal_name="Company A", slug="a")
        self.other = Company.objects.create(legal_name="Company B", slug="b")
        self.user = User.objects.create_user(email="operator@example.test", password="test")
        Membership.objects.create(user=self.user, company=self.company, role=Role.OPERATOR)
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.headers = {"HTTP_X_COMPANY_ID": str(self.company.id)}
        self.party = {
            "company_name": "Company", "person_name": "Contact",
            "phone_number": "5555555555", "email_address": "person@example.test",
            "street_lines": ["1 Main Street"], "city": "Austin", "state": "TX",
            "postal_code": "78701", "country_code": "US",
        }
        recipient = {
            "email": "", "created": False, "received": False,
            "delivery_estimate": False, "delivered": False,
        }
        self.preferences = {
            "sender": {**recipient, "email": "sender@example.test", "created": True},
            "recipient": dict(recipient),
            "other": {**recipient, "email": "uslogistics@globalpackcenter.com"},
            "requester": dict(recipient),
        }

    def test_address_saved_and_company_scoped(self):
        response = self.client.post(
            "/api/integrations/fedex/addresses/",
            {"label": "Austin", "party": self.party}, format="json", **self.headers,
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["party"]["state"], "TX")
        addresses = self.client.get("/api/integrations/fedex/addresses/", **self.headers)
        self.assertEqual(len(addresses.data["addresses"]), 1)
        Membership.objects.create(user=self.user, company=self.other, role=Role.OPERATOR)
        other_headers = {"HTTP_X_COMPANY_ID": str(self.other.id)}
        addresses = self.client.get("/api/integrations/fedex/addresses/", **other_headers)
        self.assertEqual(addresses.data["addresses"], [])

    def test_preferences_persist_by_company_and_cb(self):
        url = "/api/integrations/fedex/preferences/S123456789/"
        response = self.client.put(url, self.preferences, format="json", **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(url, **self.headers).data["preferences"], self.preferences)
        self.assertIsNone(self.client.get(
            "/api/integrations/fedex/preferences/S987654321/", **self.headers
        ).data["preferences"])
        Membership.objects.create(user=self.user, company=self.other, role=Role.OPERATOR)
        self.assertIsNone(self.client.get(
            url, HTTP_X_COMPANY_ID=str(self.other.id)
        ).data["preferences"])

    def test_role_and_invalid_preferences_are_rejected(self):
        url = "/api/integrations/fedex/preferences/S123456789/"
        self.preferences["other"]["email"] = "elsewhere@example.test"
        self.assertEqual(
            self.client.put(url, self.preferences, format="json", **self.headers).status_code, 400
        )
        self.preferences["other"]["email"] = "uslogistics@globalpackcenter.com"
        self.preferences["recipient"]["created"] = True
        self.assertEqual(
            self.client.put(url, self.preferences, format="json", **self.headers).status_code, 400
        )
        Membership.objects.filter(user=self.user, company=self.company).update(role=Role.CLIENT)
        self.assertEqual(self.client.get(url, **self.headers).status_code, 403)
        self.assertEqual(
            self.client.get("/api/integrations/fedex/addresses/", **self.headers).status_code, 403
        )

    def test_company_addresses_are_shared_with_another_authorized_operator(self):
        self.client.post(
            "/api/integrations/fedex/addresses/",
            {"label": "Austin", "party": self.party}, format="json", **self.headers,
        )
        user = User.objects.create_user(email="second@example.test", password="test")
        Membership.objects.create(user=user, company=self.company, role=Role.OPERATOR)
        self.client.force_authenticate(user)
        response = self.client.get("/api/integrations/fedex/addresses/", **self.headers)
        self.assertEqual(response.data["addresses"][0]["label"], "Austin")
