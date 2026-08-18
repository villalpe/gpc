from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from companies.models import Company
from accounts.models import Membership, Role
from audit.models import AuditEvent


class AuditEventsTests(TestCase):
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
        self.user = User.objects.create_user(email="audit@gpc.com", password=self.password)
        Membership.objects.create(user=self.user, company=self.company, role=Role.SUPERADMIN, is_active=True)

        token_res = self.client.post("/api/token/", {"email": "audit@gpc.com", "password": self.password}, format="json")
        token = token_res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_permissions_endpoint_writes_audit_event(self):
        res = self.client.get("/api/me/permissions/", HTTP_X_COMPANY_ID=str(self.company.id))
        self.assertEqual(res.status_code, 200)

        ev = AuditEvent.objects.filter(action="accounts.permissions.read").first()
        self.assertIsNotNone(ev)
        self.assertEqual(ev.status, "success")