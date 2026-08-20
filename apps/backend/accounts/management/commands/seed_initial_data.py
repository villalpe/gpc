from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Membership, Role
from companies.models import Company

DEFAULT_PASSWORD = "ChangeMe123!"


class Command(BaseCommand):
    help = "Seed inicial de compañías, usuarios, memberships y (opcional) demo data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-demo-data",
            action="store_true",
            help="Crea datos demo mínimos por módulo",
        )
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help=f"Resetea passwords de usuarios semilla a '{DEFAULT_PASSWORD}'",
        )
        parser.add_argument(
            "--company-slug",
            type=str,
            default=None,
            help="Si se envía, solo crea/actualiza esa compañía",
        )
        parser.add_argument(
            "--env",
            type=str,
            default="dev",
            choices=["dev", "staging", "prod"],
            help="Entorno para ajustar datos semilla",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        with_demo_data = options["with_demo_data"]
        reset_passwords = options["reset_passwords"]
        only_slug = options["company_slug"]
        env = options["env"]

        User = get_user_model()

        # 1) Compañías base
        companies_seed = [
            {
                "slug": "gpc-demo",
                "legal_name": "GPC Legal SA de CV",
                "trade_name": "GPC Demo",
                "is_active": True,
            },
            {
                "slug": "acme-industrial",
                "legal_name": "Acme Industrial SA",
                "trade_name": "Acme",
                "is_active": True,
            },
        ]

        if only_slug:
            companies_seed = [c for c in companies_seed if c["slug"] == only_slug]
            if not companies_seed:
                self.stdout.write(
                    self.style.WARNING(
                        f"No hay seed predefinido para slug='{only_slug}'. Se omite."
                    )
                )
                return

        companies = {}
        for c in companies_seed:
            company, created = Company.objects.update_or_create(
                slug=c["slug"],
                defaults={
                    "legal_name": c["legal_name"],
                    "trade_name": c["trade_name"],
                    "is_active": c["is_active"],
                },
            )
            companies[c["slug"]] = company
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Creada' if created else 'Actualizada'} compañía: {company.slug}"
                )
            )

        # 2) Usuarios base
        users_seed = [
            {
                "email": "superadmin@gpc.local",
                "first_name": "Super",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "admin@gpc.local",
                "first_name": "Admin",
                "last_name": "Empresa",
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "email": "operator@gpc.local",
                "first_name": "Operador",
                "last_name": "Demo",
                "is_staff": False,
                "is_superuser": False,
            },
            {
                "email": "viewer@gpc.local",
                "first_name": "Viewer",
                "last_name": "Demo",
                "is_staff": False,
                "is_superuser": False,
            },
        ]

        users = {}
        for u in users_seed:
            user, created = User.objects.get_or_create(
                email=u["email"],
                defaults={
                    "first_name": u["first_name"],
                    "last_name": u["last_name"],
                    "is_staff": u["is_staff"],
                    "is_superuser": u["is_superuser"],
                },
            )

            # Mantener flags alineados si ya existía
            changed = False
            for field in ["first_name", "last_name", "is_staff", "is_superuser"]:
                if getattr(user, field) != u[field]:
                    setattr(user, field, u[field])
                    changed = True

            if reset_passwords or created:
                user.set_password(DEFAULT_PASSWORD)
                changed = True

            if changed:
                user.save()

            users[u["email"]] = user
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Creado' if created else 'Actualizado'} usuario: {user.email}"
                )
            )

        # 3) Memberships idempotentes
        memberships_seed = []
        if "gpc-demo" in companies:
            memberships_seed.extend([
                ("superadmin@gpc.local", "gpc-demo", Role.SUPERADMIN),
                ("admin@gpc.local", "gpc-demo", Role.ADMIN_COMPANY),
                ("operator@gpc.local", "gpc-demo", Role.OPERATOR),
                ("viewer@gpc.local", "gpc-demo", Role.VIEWER),
            ])

        if "acme-industrial" in companies:
            memberships_seed.extend([
                ("superadmin@gpc.local", "acme-industrial", Role.SUPERADMIN),
                ("admin@gpc.local", "acme-industrial", Role.ADMIN_COMPANY),
                ("viewer@gpc.local", "acme-industrial", Role.VIEWER),
            ])

        for email, slug, role in memberships_seed:
            membership, created = Membership.objects.update_or_create(
                user=users[email],
                company=companies[slug],
                defaults={
                    "role": role,
                    "is_active": True,
                },
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Creada' if created else 'Actualizada'} membership: "
                    f"{email} | {slug} | {role}"
                )
            )

        # 4) Demo data mínimo (placeholder)
        if with_demo_data:
            # Aquí puedes agregar creación de registros en inventory/audit cuando
            # tengas modelos concretos (por ejemplo Item, AuditEvent, etc).
            # Se deja mensaje para no romper si aún no existen esos modelos.
            self.stdout.write(
                self.style.WARNING(
                    "with-demo-data activo: agrega aquí seeds de inventory/audit "
                    "cuando esos modelos estén definidos."
                )
            )

        # 5) Mensaje final
        self.stdout.write(self.style.SUCCESS("Seed inicial completado."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Password semilla actual: {DEFAULT_PASSWORD} "
                "(recomendado cambiarla al entrar)."
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f"Entorno ejecutado: {env}")
        )