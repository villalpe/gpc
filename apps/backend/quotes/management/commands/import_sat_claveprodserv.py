import csv
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from quotes.models import SatClaveProdServ


def parse_bool(value: str) -> bool:
    v = (value or "").strip().lower()
    return v in {"1", "si", "sí", "true", "x", "vigente"}


def parse_date(value: str):
    raw = (value or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


class Command(BaseCommand):
    help = "Importa catálogo SAT c_ClaveProdServ desde CSV"

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=str, help="Ruta del CSV")
        parser.add_argument("--truncate", action="store_true", help="Borra catálogo antes de importar")

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = Path(options["csv_path"])
        if not csv_path.exists():
            raise CommandError(f"No existe archivo: {csv_path}")

        if options["truncate"]:
            SatClaveProdServ.objects.all().delete()
            self.stdout.write(self.style.WARNING("Catálogo previo eliminado."))

        created = 0
        updated = 0

        with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)

            # Mapeo flexible de encabezados frecuentes SAT
            for row in reader:
                clave = (row.get("c_ClaveProdServ") or row.get("ClaveProdServ") or row.get("Clave") or "").strip()
                descripcion = (row.get("Descripción") or row.get("Descripcion") or row.get("descripcion") or "").strip()

                if not clave or not descripcion:
                    continue

                obj, was_created = SatClaveProdServ.objects.update_or_create(
                    clave=clave,
                    defaults={
                        "descripcion": descripcion,
                        "vigente": parse_bool(row.get("Vigente") or "si"),
                        "fecha_inicio_vigencia": parse_date(row.get("FechaInicioVigencia") or row.get("Fecha inicio de vigencia") or ""),
                        "fecha_fin_vigencia": parse_date(row.get("FechaFinVigencia") or row.get("Fecha fin de vigencia") or ""),
                        "incluir_iva_trasladado": (row.get("IncluirIVAtrasladado") or "").strip(),
                        "incluir_ieps_trasladado": (row.get("IncluirIEPStrasladado") or "").strip(),
                        "complemento_que_debe_incluir": (row.get("Complemento que debe incluir") or row.get("ComplementoQueDebeIncluir") or "").strip(),
                        "estimulo_franja_fronteriza": (row.get("EstimuloFranjaFronteriza") or "").strip(),
                        "palabras_similares": (row.get("Palabras similares") or row.get("PalabrasSimilares") or "").strip(),
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(self.style.SUCCESS(f"Importación OK. creados={created}, actualizados={updated}"))