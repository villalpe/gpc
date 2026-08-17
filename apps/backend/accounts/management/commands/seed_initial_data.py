from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from companies.models import Company
from accounts.models import Membership, Role


class Command(BaseCommand):
    help = "Seed initial data: company + superadmin membership"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, type=str)
        parser.add_argument("--password", required=True, type=str)
        parser.add_argument("--legal-name", default="GPC Demo S.A. de C.V.", type=str)
        parser.add_argument("--trade-name", default="GPC Demo", type=str)
        parser.add_argument("--slug", default="gpc-demo", type=str)

    def handle(self, *args, **opts):
        User = get_user_model()

        email = opts["email"]
        password = opts["password"]
        legal_name = opts["legal_name"]
        trade_name = opts["trade_name"]
        slug = opts["slug"]

        user, created_user = User.objects.get_or_create(
            email=email,
            defaults={
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created_user:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"User created: {email}"))
        else:
            self.stdout.write(self.style.WARNING(f"User already exists: {email}"))

        company, created_company = Company.objects.get_or_create(
            legal_name=legal_name,
            defaults={
                "trade_name": trade_name,
                "slug": slugify(slug),
                "is_active": True,
            },
        )
        if created_company:
            self.stdout.write(self.style.SUCCESS(f"Company created: {company.legal_name}"))
        else:
            self.stdout.write(self.style.WARNING(f"Company already exists: {company.legal_name}"))

        membership, created_membership = Membership.objects.get_or_create(
            user=user,
            company=company,
            defaults={"role": Role.SUPERADMIN, "is_active": True},
        )
        if created_membership:
            self.stdout.write(self.style.SUCCESS("SUPERADMIN membership created"))
        else:
            self.stdout.write(self.style.WARNING("Membership already exists"))

        self.stdout.write(self.style.SUCCESS("seed_initial_data finished successfully"))