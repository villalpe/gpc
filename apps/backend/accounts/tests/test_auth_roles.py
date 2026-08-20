from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Membership, Role
from companies.models import Company


class AuthRolesTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            email="admin@gpc.com",
            password="Admin1234!"
        )
        self.company = Company.objects.create(
            legal_name="GPC Test SA",
            trade_name="GPC Test",
            slug="gpc-test",
            is_active=True
        )
        Membership.objects.create(
            user=self.user,
            company=self.company,
            role=Role.SUPERADMIN,
            is_active=True
        )

    def auth_headers(self):
        res = self.client.post(
            reverse("token_obtain_pair"),
            {"email": "admin@gpc.com", "password": "Admin1234!"},
            format="json"
        )
        self.assertEqual(res.status_code, 200)
        token = res.data["access"]
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_me_requires_auth(self):
        res = self.client.get(reverse("me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_ok_with_auth(self):
        res = self.client.get(reverse("me"), **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "admin@gpc.com")

    def test_company_ping_requires_header(self):
        res = self.client.get(reverse("company_scope_ping"), **self.auth_headers())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_company_ping_ok(self):
        headers = self.auth_headers()
        headers["HTTP_X_COMPANY_ID"] = str(self.company.id)
        res = self.client.get(reverse("company_scope_ping"), **headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_audit_module_ping_ok_for_superadmin(self):
        headers = self.auth_headers()
        headers["HTTP_X_COMPANY_ID"] = str(self.company.id)
        res = self.client.get(reverse("audit_module_ping"), **headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)