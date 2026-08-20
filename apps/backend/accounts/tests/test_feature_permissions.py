from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Membership, Role, User
from companies.models import Company


class FeaturePermissionsAPITests(APITestCase):
    def setUp(self):
        self.password = "Test1234!"
        self.company = Company.objects.create(
            legal_name="GPC Legal SA de CV",
            trade_name="GPC Demo",
            slug="gpc-demo",
            is_active=True,
        )

        # usuarios por rol
        self.u_super = User.objects.create_user(email="super@gpc.com", password=self.password)
        self.u_admin = User.objects.create_user(email="admin@gpc.com", password=self.password)
        self.u_operator = User.objects.create_user(email="operator@gpc.com", password=self.password)
        self.u_viewer = User.objects.create_user(email="viewer@gpc.com", password=self.password)

        Membership.objects.create(user=self.u_super, company=self.company, role=Role.SUPERADMIN, is_active=True)
        Membership.objects.create(user=self.u_admin, company=self.company, role=Role.ADMIN_COMPANY, is_active=True)
        Membership.objects.create(user=self.u_operator, company=self.company, role=Role.OPERATOR, is_active=True)
        Membership.objects.create(user=self.u_viewer, company=self.company, role=Role.VIEWER, is_active=True)

    def _auth(self, email, password):
        res = self.client.post(
            "/api/token/",
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _get_permissions(self, company_id):
        return self.client.get(
            "/api/me/permissions/",
            HTTP_X_COMPANY_ID=str(company_id),
        )

    def test_permissions_superadmin(self):
        self._auth("super@gpc.com", self.password)
        res = self._get_permissions(self.company.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data["permissions"],
            sorted([
                "inventory.read",
                "inventory.write",
                "inventory.adjust",
                "audit.read",
                "users.invite",
                "users.disable",
            ]),
        )

    def test_permissions_admin_company(self):
        self._auth("admin@gpc.com", self.password)
        res = self._get_permissions(self.company.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data["permissions"],
            sorted([
                "inventory.read",
                "inventory.write",
                "inventory.adjust",
                "audit.read",
                "users.invite",
            ]),
        )

    def test_permissions_operator(self):
        self._auth("operator@gpc.com", self.password)
        res = self._get_permissions(self.company.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data["permissions"],
            sorted([
                "inventory.read",
                "inventory.write",
            ]),
        )

    def test_permissions_viewer(self):
        self._auth("viewer@gpc.com", self.password)
        res = self._get_permissions(self.company.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data["permissions"],
            sorted([
                "inventory.read",
                "audit.read",
            ]),
        )

    def test_permissions_requires_company_header(self):
        self._auth("super@gpc.com", self.password)
        res = self.client.get("/api/me/permissions/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", res.data)

    def test_permissions_no_membership_returns_empty_list(self):
        outsider = User.objects.create_user(email="outsider@gpc.com", password=self.password)
        self._auth("outsider@gpc.com", self.password)
        res = self._get_permissions(self.company.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["permissions"], [])