from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase

from accounts.models import Membership, Role
from companies.models import Company


class SeedInitialDataCommandTests(TestCase):
    def test_seed_creates_companies_users_memberships(self):
        out = StringIO()
        call_command(
            "seed_initial_data",
            "--env", "dev",
            "--reset-passwords",
            stdout=out,
        )

        # compañías
        self.assertTrue(Company.objects.filter(slug="gpc-demo").exists())
        self.assertTrue(Company.objects.filter(slug="acme-industrial").exists())

        # usuarios
        User = get_user_model()
        self.assertTrue(User.objects.filter(email="superadmin@gpc.local").exists())
        self.assertTrue(User.objects.filter(email="admin@gpc.local").exists())
        self.assertTrue(User.objects.filter(email="operator@gpc.local").exists())
        self.assertTrue(User.objects.filter(email="viewer@gpc.local").exists())

        # memberships mínimas esperadas
        gpc = Company.objects.get(slug="gpc-demo")
        acme = Company.objects.get(slug="acme-industrial")

        self.assertTrue(
            Membership.objects.filter(
                user__email="superadmin@gpc.local",
                company=gpc,
                role=Role.SUPERADMIN,
                is_active=True,
            ).exists()
        )
        self.assertTrue(
            Membership.objects.filter(
                user__email="admin@gpc.local",
                company=gpc,
                role=Role.ADMIN_COMPANY,
                is_active=True,
            ).exists()
        )
        self.assertTrue(
            Membership.objects.filter(
                user__email="operator@gpc.local",
                company=gpc,
                role=Role.OPERATOR,
                is_active=True,
            ).exists()
        )
        self.assertTrue(
            Membership.objects.filter(
                user__email="viewer@gpc.local",
                company=gpc,
                role=Role.VIEWER,
                is_active=True,
            ).exists()
        )

        self.assertTrue(
            Membership.objects.filter(
                user__email="superadmin@gpc.local",
                company=acme,
                role=Role.SUPERADMIN,
                is_active=True,
            ).exists()
        )

    def test_seed_is_idempotent(self):
        call_command("seed_initial_data", "--env", "dev")
        count_companies_1 = Company.objects.count()
        count_memberships_1 = Membership.objects.count()

        # correr segunda vez no debe duplicar
        call_command("seed_initial_data", "--env", "dev")
        count_companies_2 = Company.objects.count()
        count_memberships_2 = Membership.objects.count()

        self.assertEqual(count_companies_1, count_companies_2)
        self.assertEqual(count_memberships_1, count_memberships_2)

    def test_seed_company_slug_filters_scope(self):
        call_command("seed_initial_data", "--company-slug", "gpc-demo", "--env", "dev")

        self.assertTrue(Company.objects.filter(slug="gpc-demo").exists())
        self.assertFalse(Company.objects.filter(slug="acme-industrial").exists())

    def test_reset_passwords_sets_known_password(self):
        User = get_user_model()

        # crear usuario previo con password distinta
        u = User.objects.create_user(email="admin@gpc.local", password="OldPass123!")
        self.assertTrue(u.check_password("OldPass123!"))

        call_command("seed_initial_data", "--env", "dev", "--reset-passwords")
        u.refresh_from_db()

        self.assertTrue(u.check_password("ChangeMe123!"))