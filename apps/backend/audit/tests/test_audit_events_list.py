from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Membership, Role
from audit.models import AuditEvent
from companies.models import Company


class AuditEventsListTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Test1234!"

        self.company = Company.objects.create(
            legal_name="GPC Legal SA de CV",
            trade_name="GPC Demo",
            slug="gpc-demo",
            is_active=True,
        )

        User = get_user_model()
        self.admin = User.objects.create_user(email="admin.audit@gpc.com", password=self.password)
        self.viewer = User.objects.create_user(email="viewer.audit@gpc.com", password=self.password)

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

        AuditEvent.objects.create(
            company_id=self.company.id,
            user=self.admin,
            action="accounts.permissions.read",
            status="success",
            path="/api/me/permissions/",
            method="GET",
            metadata={"permissions_count": 3},
        )

    def _login(self, email):
        res = self.client.post(
            "/api/token/",
            {"email": email, "password": self.password},
            format="json",
        )
        token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_admin_can_list_events(self):
        self._login("admin.audit@gpc.com")
        res = self.client.get("/api/audit/events/", {"company_id": str(self.company.id)})
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.data["count"], 1)

    def test_viewer_forbidden(self):
        self._login("viewer.audit@gpc.com")
        res = self.client.get("/api/audit/events/", {"company_id": str(self.company.id)})
        self.assertEqual(res.status_code, 403)

    def test_requires_company_id(self):
        self._login("admin.audit@gpc.com")
        res = self.client.get("/api/audit/events/")
        self.assertEqual(res.status_code, 400)