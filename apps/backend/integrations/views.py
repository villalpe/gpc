import base64
import binascii
import json
import logging
import re
import smtplib

import requests
from django.conf import settings
from django.core.mail import EmailMessage
from django.core.serializers.json import DjangoJSONEncoder
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Role
from accounts.permission_service import can_view_price
from accounts.permissions import CanAccessQuotes, user_role_for_company
from companies.models import Company
from core.company_context import get_active_company_id

from .fedex_notifications import GROUP_LABELS, send_creation_notification
from .models import (
    FedexNotificationPreferences,
    FedexSavedAddress,
    FedexShipment,
    FedexShipmentLabel,
)
from .providers.fedex.client import FedexClient
from .providers.fedex.mappers import (
    build_fedex_shipment_request,
    map_fedex_shipment,
    map_fedex_tracking,
)
from .providers.fedex.rates import build_rate_request, normalize_rate_response
from .providers.skydropx.client import SkydropxClient
from .providers.skydropx.mappers import map_skydropx_shipments_list
from .serializers import (
    FedexCreateShipmentSerializer,
    FedexEmailShipmentSerializer,
    FedexNotificationPreferencesSerializer,
    FedexRateSerializer,
    FedexSavedAddressSerializer,
    FedexTrackRequestSerializer,
)

logger = logging.getLogger(__name__)


class FedexCompanyDataView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def company_id(self, request):
        company_id = get_active_company_id(request)
        if not can_view_price(request.user, company_id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para gestionar datos FedEx.")
        return company_id


class FedexSavedAddressesView(FedexCompanyDataView):
    def get(self, request):
        addresses = FedexSavedAddress.objects.filter(company_id=self.company_id(request))
        return Response({"addresses": FedexSavedAddressSerializer(addresses, many=True).data})

    def post(self, request):
        company_id = self.company_id(request)
        serializer = FedexSavedAddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address = FedexSavedAddress.objects.create(
            company_id=company_id, created_by=request.user, **serializer.validated_data
        )
        return Response(FedexSavedAddressSerializer(address).data, status=status.HTTP_201_CREATED)


class FedexNotificationPreferencesView(FedexCompanyDataView):
    def get(self, request, cb_number):
        company_id = self.company_id(request)
        obj = FedexNotificationPreferences.objects.filter(
            company_id=company_id, cb_number=cb_number
        ).first()
        return Response({"preferences": obj.preferences if obj else None})

    def put(self, request, cb_number):
        company_id = self.company_id(request)
        serializer = FedexNotificationPreferencesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, _ = FedexNotificationPreferences.objects.update_or_create(
            company_id=company_id, cb_number=cb_number,
            defaults={"preferences": serializer.validated_data},
        )
        return Response({"preferences": obj.preferences})


class FedexRatesView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def post(self, request):
        company_id = get_active_company_id(request)
        if not can_view_price(request.user, company_id):
            return Response(
                {"detail": "No tienes permiso para consultar tarifas."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = FedexRateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not all((
            settings.FEDEX_ACCOUNT_NUMBER,
            settings.FEDEX_API_KEY,
            settings.FEDEX_SECRET_KEY,
            settings.FEDEX_BASE_URL,
        )):
            return Response(
                {"detail": "Faltan la cuenta o credenciales FedEx en el backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if settings.FEDEX_BASE_URL.rstrip("/") != "https://apis-sandbox.fedex.com":
            return Response(
                {"detail": "La comparación de tarifas está disponible solo en sandbox."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            payload = build_rate_request(serializer.validated_data, settings.FEDEX_ACCOUNT_NUMBER)
            raw = FedexClient().rates(payload)
            return Response({"rates": normalize_rate_response(raw)})
        except requests.HTTPError as error:
            upstream = error.response
            codes = []
            if upstream is not None:
                try:
                    errors = upstream.json().get("errors", [])
                    codes = [
                        entry.get("code") for entry in errors
                        if isinstance(entry, dict)
                        and isinstance(entry.get("code"), str)
                        and re.fullmatch(r"[A-Za-z0-9._-]{1,100}", entry["code"])
                    ]
                except (ValueError, AttributeError, TypeError):
                    logger.warning("Respuesta de error FedEx inválida.")
            logger.warning("FedEx rechazó la consulta de tarifas (HTTP %s).",
                           upstream.status_code if upstream is not None else "desconocido")
            return Response(
                {"detail": "FedEx rechazó la consulta de tarifas.", "codes": codes},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except requests.Timeout:
            logger.warning("La consulta de tarifas FedEx excedió el tiempo de espera.")
            return Response(
                {"detail": "FedEx tardó demasiado al consultar las tarifas."},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except (requests.RequestException, ValueError, KeyError, TypeError):
            logger.exception("No se pudo consultar o interpretar las tarifas FedEx.")
            return Response(
                {"detail": "No se pudo consultar o interpretar la respuesta de FedEx."},
                status=status.HTTP_502_BAD_GATEWAY,
            )


class FedexTrackView(APIView):
    """
    POST /api/integrations/fedex/track/
    body: { "tracking_number": "449044304137821" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FedexTrackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tracking_number = serializer.validated_data["tracking_number"]

        try:
            client = FedexClient()
            raw = client.track(tracking_number)
            normalized = map_fedex_tracking(raw, tracking_number)

            # Si quieres conservar raw temporalmente para debug:
            # normalized["raw"] = raw

            return Response(normalized, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    "provider": "fedex",
                    "tracking_number": tracking_number,
                    "error": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )


class FedexCreateShipmentView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    @staticmethod
    def _company_and_role(request):
        company_id = get_active_company_id(request)
        role = user_role_for_company(request.user, company_id)
        if not role or not Company.objects.filter(pk=company_id, is_active=True).exists():
            raise PermissionDenied(
                "Debes pertenecer a una empresa activa para crear guías FedEx."
            )
        return company_id, role

    @staticmethod
    def _shipment_response(shipment):
        return {
            "id": shipment.id,
            "cb_number": shipment.cb_number,
            "status": shipment.status,
            "ship_date": shipment.ship_date.isoformat(),
            "service_type": shipment.service_type,
            "tracking_number": shipment.tracking_number,
            "tracking_numbers": shipment.tracking_numbers,
            "labels": [
                {"id": label.id, "file_name": label.file_name}
                for label in shipment.labels.all()
            ],
            "warning": shipment.warning,
            "notification_status": shipment.notification_status,
            "notification_error": shipment.notification_error,
        }

    @staticmethod
    def _sanitize_snapshot(data):
        snapshot = {
            key: value
            for key, value in data.items()
            if key not in {"payment_account_number", "duties_account_number"}
        }
        return json.loads(json.dumps(snapshot, cls=DjangoJSONEncoder))

    @staticmethod
    def _mark_uncertain(shipment, detail, mapped=None):
        shipment.status = FedexShipment.Status.UNCERTAIN
        shipment.error_detail = detail[:500]
        if mapped:
            shipment.tracking_number = mapped["tracking_number"]
            shipment.tracking_numbers = mapped["tracking_numbers"]
            shipment.warning = mapped["warning"] or detail
        else:
            shipment.warning = detail
        shipment.save(
            update_fields=[
                "status",
                "error_detail",
                "tracking_number",
                "tracking_numbers",
                "warning",
                "updated_at",
            ]
        )

    def post(self, request):
        if not settings.FEDEX_SHIPMENT_CREATION_ENABLED:
            return Response(
                {"detail": "La creación de guías FedEx está desactivada para revisión."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        company_id, role = self._company_and_role(request)
        if role not in {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR}:
            raise PermissionDenied("No tienes permiso para crear guías FedEx.")

        serializer = FedexCreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if (
            data["sender"]["country_code"].upper() != "US"
            or data["recipient"]["country_code"].upper() != "US"
        ):
            return Response(
                {
                    "detail": (
                        "La creación de guías solo está habilitada para envíos "
                        "domésticos US→US."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if data["pickup_type"] != "DROPOFF_AT_FEDEX_LOCATION":
            return Response(
                {
                    "detail": (
                        "En esta etapa solo se permite dejar el paquete en una "
                        "ubicación FedEx."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not settings.FEDEX_ACCOUNT_NUMBER:
            return Response(
                {"detail": "FEDEX_ACCOUNT_NUMBER no está configurado en el backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if (
            not settings.FEDEX_BASE_URL
            or not settings.FEDEX_API_KEY
            or not settings.FEDEX_SECRET_KEY
        ):
            return Response(
                {"detail": "Faltan las credenciales o la URL de FedEx en el backend."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if settings.FEDEX_BASE_URL.rstrip("/") != "https://apis-sandbox.fedex.com":
            return Response(
                {"detail": "La creación de guías está restringida al sandbox de FedEx."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payload = build_fedex_shipment_request(data, settings.FEDEX_ACCOUNT_NUMBER)
        try:
            with transaction.atomic():
                preferences = FedexNotificationPreferences.objects.filter(
                    company_id=company_id, cb_number=data["cb_number"]
                ).first()
                groups = [
                    group for group in GROUP_LABELS
                    if preferences and preferences.preferences.get(group, {}).get("created")
                ]
                shipment = FedexShipment.objects.create(
                    company_id=company_id,
                    cb_number=data["cb_number"],
                    created_by=request.user,
                    status=FedexShipment.Status.PROCESSING,
                    ship_date=data["ship_date"],
                    service_type=data["service_type"],
                    pickup_type=data["pickup_type"],
                    shipment_data=self._sanitize_snapshot(data),
                    notification_groups=groups,
                    notification_status=(
                        FedexShipment.NotificationStatus.PENDING if groups
                        else FedexShipment.NotificationStatus.NOT_REQUESTED
                    ),
                )
        except IntegrityError:
            existing = FedexShipment.objects.filter(
                company_id=company_id,
                cb_number=data["cb_number"],
                status__in=[
                    FedexShipment.Status.PROCESSING,
                    FedexShipment.Status.CREATED,
                    FedexShipment.Status.UNCERTAIN,
                ],
            ).first()
            if existing is None:
                raise
            return Response(
                {
                    "detail": (
                        f"El CB {data['cb_number']} ya tiene un envío FedEx "
                        f"con estado «{existing.get_status_display()}». "
                        "No se enviará otra solicitud."
                    ),
                    "shipment": self._shipment_response(existing),
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            raw = FedexClient().create_shipment(payload)
        except requests.HTTPError as error:
            upstream = error.response
            codes = []
            if upstream is not None:
                try:
                    codes = [
                        item["code"]
                        for item in upstream.json().get("errors", [])
                        if isinstance(item, dict)
                        and isinstance(item.get("code"), str)
                        and re.fullmatch(r"[A-Za-z0-9._-]{1,100}", item["code"])
                    ]
                except (ValueError, AttributeError, TypeError):
                    logger.warning("FedEx returned an invalid shipment rejection body.")
            upstream_status = upstream.status_code if upstream is not None else "unknown"
            logger.warning("FedEx shipment creation failed: %s", upstream_status)
            if upstream is not None and upstream.status_code in {400, 422} and codes:
                shipment.status = FedexShipment.Status.FAILED
                shipment.error_detail = "FedEx rechazó la solicitud."
                shipment.save(update_fields=["status", "error_detail", "updated_at"])
            else:
                detail = (
                    "FedEx no confirmó el resultado de la solicitud. Verifica si "
                    "creó el envío antes de resolver el bloqueo del CB."
                )
                self._mark_uncertain(shipment, detail)
            return Response(
                {
                    "detail": (
                        "FedEx rechazó la solicitud de envío."
                        if shipment.status == FedexShipment.Status.FAILED
                        else "FedEx no confirmó el resultado de la solicitud."
                    ),
                    "codes": codes,
                    "shipment": self._shipment_response(shipment),
                },
                status=(
                    status.HTTP_502_BAD_GATEWAY
                    if shipment.status == FedexShipment.Status.UNCERTAIN
                    else status.HTTP_400_BAD_REQUEST
                ),
            )
        except requests.Timeout:
            logger.exception("FedEx shipment creation timed out")
            detail = (
                "FedEx no confirmó la respuesta. Verifica si creó el envío antes "
                "de resolver el bloqueo del CB."
            )
            self._mark_uncertain(shipment, detail)
            return Response(
                {"detail": detail, "shipment": self._shipment_response(shipment)},
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except requests.RequestException:
            logger.exception("FedEx shipment creation had an ambiguous network error")
            detail = (
                "No se pudo confirmar la creación en FedEx. Verifica si existe "
                "antes de resolver el bloqueo del CB."
            )
            self._mark_uncertain(shipment, detail)
            return Response(
                {"detail": detail, "shipment": self._shipment_response(shipment)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except (ValueError, KeyError, TypeError, AttributeError):
            logger.exception("FedEx shipment response could not be mapped")
            detail = (
                "FedEx respondió de forma inesperada. Verifica si creó el envío "
                "antes de resolver el bloqueo del CB."
            )
            self._mark_uncertain(shipment, detail)
            return Response(
                {"detail": detail, "shipment": self._shipment_response(shipment)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            mapped = map_fedex_shipment(raw, data["cb_number"])
            tracking_numbers = [
                value
                for value in mapped["tracking_numbers"]
                if isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9]{1,40}", value)
            ]
            mapped["tracking_numbers"] = tracking_numbers
            mapped["tracking_number"] = tracking_numbers[0] if tracking_numbers else ""
            decoded_labels = []
            total_size = 0
            for index, label in enumerate(mapped["labels"], start=1):
                encoded = label.get("content_base64")
                if not isinstance(encoded, str) or len(encoded) > 14 * 1024 * 1024:
                    raise ValueError("FedEx devolvió una etiqueta inválida.")
                content = base64.b64decode(encoded, validate=True)
                total_size += len(content)
                if (
                    len(content) > 10 * 1024 * 1024
                    or total_size > 20 * 1024 * 1024
                    or not content.startswith(b"%PDF-")
                ):
                    raise ValueError("FedEx devolvió una etiqueta PDF inválida o demasiado grande.")
                decoded_labels.append(
                    (f"{data['cb_number']}-fedex-label-{index}.pdf", content)
                )
        except (ValueError, KeyError, TypeError, AttributeError, binascii.Error):
            logger.exception("FedEx accepted the request but its label response was invalid.")
            mapped = locals().get("mapped")
            detail = (
                "FedEx recibió la solicitud, pero no se pudo validar la guía o sus "
                "etiquetas. Verifica el resultado antes de resolver el bloqueo del CB."
            )
            self._mark_uncertain(shipment, detail, mapped)
            return Response(
                {"detail": detail, "shipment": self._shipment_response(shipment)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        shipment.tracking_numbers = tracking_numbers
        shipment.tracking_number = tracking_numbers[0] if tracking_numbers else ""
        shipment.warning = mapped["warning"]
        shipment.fedex_transaction_id = str(
            raw.get("transactionId") or raw.get("output", {}).get("transactionId") or ""
        )[:100]
        if not shipment.tracking_number or not decoded_labels:
            shipment.status = FedexShipment.Status.UNCERTAIN
            shipment.error_detail = (
                "FedEx aceptó la solicitud, pero faltó una guía o etiqueta verificable."
            )
            shipment.warning = mapped["warning"] or shipment.error_detail
        else:
            shipment.status = FedexShipment.Status.CREATED

        with transaction.atomic():
            shipment.save()
            FedexShipmentLabel.objects.bulk_create(
                [
                    FedexShipmentLabel(
                        shipment=shipment,
                        file_name=file_name,
                        content=content,
                    )
                    for file_name, content in decoded_labels
                ]
            )
        if (
            shipment.status == FedexShipment.Status.CREATED
            and shipment.notification_status == FedexShipment.NotificationStatus.PENDING
        ):
            send_creation_notification(shipment)
        return Response(
            self._shipment_response(shipment),
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        company_id = get_active_company_id(request)
        return Response(
            FedexShipmentHistoryView.list_for_company(company_id, request.user)
        )


class FedexShipmentHistoryView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    @staticmethod
    def list_for_company(company_id, user):
        shipments = (
            FedexShipment.objects.filter(company_id=company_id)
            .select_related("resolved_by")
            .prefetch_related("labels")
        )
        results = []
        for shipment in shipments:
            snapshot = shipment.shipment_data
            sender = snapshot.get("sender", {})
            recipient = snapshot.get("recipient", {})
            results.append(
                {
                    "id": shipment.id,
                    "cb_number": shipment.cb_number,
                    "status": shipment.status,
                    "status_label": shipment.get_status_display(),
                    "ship_date": shipment.ship_date.isoformat(),
                    "created_at": shipment.created_at.isoformat(),
                    "service_type": shipment.service_type,
                    "tracking_number": shipment.tracking_number,
                    "tracking_numbers": shipment.tracking_numbers,
                    "package_count": sum(
                        int(package.get("quantity", 0))
                        for package in snapshot.get("packages", [])
                    ),
                    "pickup_type": shipment.pickup_type,
                    "origin": {
                        "city": sender.get("city", ""),
                        "state": sender.get("state", ""),
                    },
                    "destination": {
                        "city": recipient.get("city", ""),
                        "state": recipient.get("state", ""),
                    },
                    "labels": [
                        {"id": label.id, "file_name": label.file_name}
                        for label in shipment.labels.all()
                    ],
                    "warning": shipment.warning,
                    "notification_status": shipment.notification_status,
                    "notification_error": shipment.notification_error,
                    "error_detail": shipment.error_detail,
                    "resolution_note": shipment.resolution_note,
                    "resolved_by_email": (
                        shipment.resolved_by.email if shipment.resolved_by else ""
                    ),
                    "resolved_at": (
                        shipment.resolved_at.isoformat() if shipment.resolved_at else None
                    ),
                }
            )
        return {
            "shipments": results,
            "can_resolve": user_role_for_company(user, company_id)
            in {Role.SUPERADMIN, Role.ADMIN_COMPANY},
            "can_notify": user_role_for_company(user, company_id)
            in {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR},
        }

    def get(self, request):
        company_id = get_active_company_id(request)
        return Response(self.list_for_company(company_id, request.user))


class FedexCreationNotificationRetryView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def post(self, request, shipment_id):
        if not settings.FEDEX_SHIPMENT_CREATION_ENABLED:
            return Response({"detail": "Los avisos FedEx están desactivados."}, status=503)
        company_id, role = FedexCreateShipmentView._company_and_role(request)
        if role not in {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR}:
            raise PermissionDenied("No tienes permiso para enviar avisos FedEx.")
        shipment = FedexShipment.objects.filter(
            pk=shipment_id, company_id=company_id, status=FedexShipment.Status.CREATED
        ).first()
        if shipment is None:
            return Response({"detail": "No se encontró el envío FedEx creado."}, status=404)
        if not send_creation_notification(shipment):
            return Response(
                {"detail": "El aviso ya fue enviado, no fue solicitado o sigue en proceso.",
                 "notification_status": shipment.notification_status,
                 "notification_error": shipment.notification_error},
                status=409,
            )
        return Response({
            "notification_status": shipment.notification_status,
            "notification_error": shipment.notification_error,
        })


class FedexShipmentLabelView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def get(self, request, label_id):
        company_id = get_active_company_id(request)
        label = FedexShipmentLabel.objects.filter(
            pk=label_id, shipment__company_id=company_id
        ).first()
        if label is None:
            return Response({"detail": "No se encontró la etiqueta FedEx."}, status=404)
        response = HttpResponse(bytes(label.content), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="{label.file_name}"'
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response


class FedexShipmentResolveView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def post(self, request, shipment_id):
        company_id = get_active_company_id(request)
        role = user_role_for_company(request.user, company_id)
        if role not in {Role.SUPERADMIN, Role.ADMIN_COMPANY}:
            raise PermissionDenied("Solo un administrador de la empresa puede resolver el envío.")

        shipment = FedexShipment.objects.filter(
            pk=shipment_id,
            company_id=company_id,
            status=FedexShipment.Status.UNCERTAIN,
        ).first()
        if shipment is None:
            return Response(
                {"detail": "No se encontró un envío pendiente de resolución."},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get("action")
        note = request.data.get("note")
        if action not in {"confirm_created", "confirm_not_created"}:
            return Response(
                {"detail": "La acción debe ser confirm_created o confirm_not_created."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(note, str) or not note.strip() or len(note.strip()) > 500:
            return Response(
                {"detail": "Agrega una nota de verificación (máximo 500 caracteres)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "confirm_created":
            tracking_number = request.data.get("tracking_number")
            if not isinstance(tracking_number, str) or not re.fullmatch(
                r"[A-Za-z0-9]{1,40}", tracking_number
            ):
                return Response(
                    {"detail": "Indica el número de rastreo confirmado en FedEx."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            shipment.status = FedexShipment.Status.CREATED
            shipment.tracking_number = tracking_number
            shipment.tracking_numbers = [tracking_number]
            if not shipment.labels.exists():
                shipment.warning = (
                    "Creación confirmada por un administrador. La etiqueta debe "
                    "recuperarse desde FedEx; no está almacenada en el sistema."
                )
        else:
            shipment.status = FedexShipment.Status.FAILED
            shipment.warning = ""

        shipment.resolved_by = request.user
        shipment.resolution_note = note.strip()
        shipment.resolved_at = timezone.now()
        shipment.error_detail = ""
        updated = FedexShipment.objects.filter(
            pk=shipment.pk,
            company_id=company_id,
            status=FedexShipment.Status.UNCERTAIN,
        ).update(
            status=shipment.status,
            tracking_number=shipment.tracking_number,
            tracking_numbers=shipment.tracking_numbers,
            warning=shipment.warning,
            resolved_by=shipment.resolved_by,
            resolution_note=shipment.resolution_note,
            resolved_at=shipment.resolved_at,
            error_detail=shipment.error_detail,
            updated_at=timezone.now(),
        )
        if not updated:
            return Response(
                {"detail": "El estado del envío cambió; actualiza el historial."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response({"shipment": FedexCreateShipmentView._shipment_response(shipment)})


class FedexEmailShipmentView(APIView):
    permission_classes = [IsAuthenticated, CanAccessQuotes]

    def post(self, request):
        if not settings.FEDEX_SHIPMENT_CREATION_ENABLED:
            return Response(
                {"detail": "El envío de guías FedEx está desactivado para revisión."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        company_id = get_active_company_id(request)
        role = user_role_for_company(request.user, company_id)
        if role not in {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR}:
            raise PermissionDenied("No tienes permiso para enviar guías FedEx.")

        serializer = FedexEmailShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        shipment = FedexShipment.objects.filter(
            company_id=company_id,
            cb_number=data["cb_number"],
            tracking_number=data["tracking_number"],
            status=FedexShipment.Status.CREATED,
        ).prefetch_related("labels").first()
        if shipment is None:
            return Response(
                {"detail": "No se encontró un envío FedEx creado con esa guía."},
                status=status.HTTP_404_NOT_FOUND,
            )
        labels = list(shipment.labels.all())
        if not labels:
            return Response(
                {"detail": "Este envío no tiene etiquetas PDF almacenadas para adjuntar."},
                status=status.HTTP_409_CONFLICT,
            )

        if (
            not settings.EMAIL_HOST_USER
            or not settings.EMAIL_HOST_PASSWORD
            or not settings.DEFAULT_FROM_EMAIL
        ):
            return Response(
                {"detail": "El correo del backend no está configurado."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        email = EmailMessage(
            subject=f"Guía FedEx de Cargobase {data['cb_number']}",
            body=(
                f"Hola,\n\nAdjuntamos la guía FedEx del envío Cargobase "
                f"{data['cb_number']}.\nNúmero de guía: {data['tracking_number']}.\n"
            ),
            to=[data["recipient_email"]],
        )

        total_size = 0
        for label in labels:
            content = bytes(label.content)
            total_size += len(content)
            if (
                not content.startswith(b"%PDF-")
                or len(content) > 10 * 1024 * 1024
                or total_size > 20 * 1024 * 1024
            ):
                return Response(
                    {"detail": "Las etiquetas almacenadas no son válidas o exceden el límite."},
                    status=status.HTTP_409_CONFLICT,
                )
            email.attach(label.file_name, content, "application/pdf")

        try:
            email.send(fail_silently=False)
        except (smtplib.SMTPException, OSError):
            logger.exception("FedEx shipment email delivery failed")
            return Response(
                {
                    "detail": (
                        "No se pudo enviar el correo. Verifica la configuración "
                        "de correo del backend."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"sent": True}, status=status.HTTP_200_OK)


class SkydropxShipmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        version = request.query_params.get("version", "v1")
        client = SkydropxClient()

        try:
            raw = client.list_shipments_v2() if version == "v2" else client.list_shipments_v1()
            normalized = map_skydropx_shipments_list(raw)
            normalized["version"] = version
            return Response(normalized, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"provider": "skydropx", "error": str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )