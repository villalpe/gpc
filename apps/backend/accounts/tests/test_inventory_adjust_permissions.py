from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, Membership, Role
from companies.models import Company
from audit.models import AuditEvent


class InventoryAdjustPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = "/api/modules/inventory/adjust/"
        self.payload = {"sku": "ABC", "delta": 5}

        self.company = Company.objects.create(
            legal_name="GPC Demo SA de CV",
            trade_name="GPC Demo",
            slug="gpc-demo",
            is_active=True,
        )

        self.admin = User.objects.create_user(
            email="admin_test@gpc.local",
            password="Pass1234!"
        )
        self.viewer = User.objects.create_user(
            email="viewer_test@gpc.local",
            password="Pass1234!"
        )

        Membership.objects.create(
            user=self.admin,
            company=self.company,
            role=Role.ADMIN_COMPANY,
            is_active=True,
        )
        Membership.objects.create(
            user=self.viewer,
            company=self.company,
            role=Role.VIEWER,
            is_active=True,
        )

    def test_admin_adjust_returns_200_and_audits_success(self):
        self.client.force_authenticate(user=self.admin)

        res = self.client.post(
            self.url,
            data=self.payload,
            format="json",
            HTTP_X_COMPANY_ID=str(self.company.id),
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data.get("ok"), True)
        self.assertEqual(res.data.get("sku"), "ABC")
        self.assertEqual(res.data.get("delta"), 5)

        ev = AuditEvent.objects.filter(
            action="inventory.adjust",
            status="success",
            company_id=self.company.id,
            user_id=self.admin.id,
        ).order_by("-created_at").first()

        self.assertIsNotNone(ev)
        self.assertEqual(ev.method, "POST")
        self.assertEqual(ev.path, "/api/modules/inventory/adjust/")
        self.assertEqual(ev.metadata.get("sku"), "ABC")
        self.assertEqual(ev.metadata.get("delta"), 5)

    def test_viewer_adjust_returns_403_and_audits_forbidden(self):
        self.client.force_authenticate(user=self.viewer)

        res = self.client.post(
            self.url,
            data=self.payload,
            format="json",
            HTTP_X_COMPANY_ID=str(self.company.id),
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get("detail"), "Forbidden")

        ev = AuditEvent.objects.filter(
            action="inventory.adjust",
            status="forbidden",
            company_id=self.company.id,
            user_id=self.viewer.id,
        ).order_by("-created_at").first()

        self.assertIsNotNone(ev)
        self.assertEqual(ev.method, "POST")
        self.assertEqual(ev.path, "/api/modules/inventory/adjust/")
        self.assertEqual(ev.metadata.get("sku"), "ABC")
        self.assertEqual(ev.metadata.get("delta"), 5)