import uuid
from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Membership, User
from companies.models import Company


class InventoryAdjustTenantScopeTests(APITestCase):
    def setUp(self):
        self.url = reverse("inventory_adjust")

        self.user = User.objects.create_user(
            email="operator@test.com",
            password="Pass1234!",
        )

        self.company_ok = Company.objects.create(
            id=uuid.uuid4(),
            legal_name="Empresa OK SA",
            trade_name="Empresa OK",
            slug="empresa-ok",
        )

        self.company_other = Company.objects.create(
            id=uuid.uuid4(),
            legal_name="Empresa Other SA",
            trade_name="Empresa Other",
            slug="empresa-other",
        )

        Membership.objects.create(
            user=self.user,
            company=self.company_ok,
            role="OPERADOR",
            is_active=True,
        )

        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")

    def test_adjust_without_company_header_returns_400(self):
        res = self.client.post(self.url, {"sku": "SKU-1", "delta": 3}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_adjust_with_invalid_company_header_returns_400(self):
        res = self.client.post(
            self.url,
            {"sku": "SKU-1", "delta": 3},
            format="json",
            HTTP_X_COMPANY_ID="invalid-uuid",
        )
        self.assertEqual(res.status_code, 400)

    def test_adjust_with_non_member_company_returns_403(self):
        res = self.client.post(
            self.url,
            {"sku": "SKU-1", "delta": 3},
            format="json",
            HTTP_X_COMPANY_ID=str(self.company_other.id),
        )
        self.assertEqual(res.status_code, 403)

    @patch("core.views.has_feature_permission", return_value=False)
    def test_adjust_without_feature_permission_returns_403(self, _mock_perm):
        res = self.client.post(
            self.url,
            {"sku": "SKU-1", "delta": 3},
            format="json",
            HTTP_X_COMPANY_ID=str(self.company_ok.id),
        )
        self.assertEqual(res.status_code, 403)

    @patch("core.views.has_feature_permission", return_value=True)
    def test_adjust_with_membership_and_permission_returns_200(self, _mock_perm):
        res = self.client.post(
            self.url,
            {"sku": "SKU-1", "delta": 3},
            format="json",
            HTTP_X_COMPANY_ID=str(self.company_ok.id),
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get("ok"), True)