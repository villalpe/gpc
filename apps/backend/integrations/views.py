import base64
import binascii
import logging
import smtplib

import requests
from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .providers.fedex.client import FedexClient
from .providers.fedex.mappers import (
    build_fedex_shipment_request,
    map_fedex_shipment,
    map_fedex_tracking,
)
from .providers.skydropx.client import SkydropxClient
from .providers.skydropx.mappers import map_skydropx_shipments_list
from .serializers import (
    FedexCreateShipmentSerializer,
    FedexEmailShipmentSerializer,
    FedexTrackRequestSerializer,
)

logger = logging.getLogger(__name__)


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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.FEDEX_SHIPMENT_CREATION_ENABLED:
            return Response(
                {"detail": "La creación de guías FedEx está desactivada para revisión."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = FedexCreateShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

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

        try:
            payload = build_fedex_shipment_request(
                serializer.validated_data,
                settings.FEDEX_ACCOUNT_NUMBER,
            )
            raw = FedexClient().create_shipment(payload)
            return Response(
                map_fedex_shipment(raw, serializer.validated_data["cb_number"]),
                status=status.HTTP_201_CREATED,
            )
        except requests.HTTPError as error:
            upstream = error.response
            details = []
            if upstream is not None:
                try:
                    details = [
                        item.get("message") or item.get("code")
                        for item in upstream.json().get("errors", [])
                        if isinstance(item, dict)
                    ]
                except (ValueError, AttributeError):
                    details = []
            upstream_status = upstream.status_code if upstream else "unknown"
            logger.warning("FedEx shipment creation failed: %s", upstream_status)
            return Response(
                {"detail": "; ".join(details) or "FedEx rechazó la solicitud de envío."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except requests.Timeout:
            logger.exception("FedEx shipment creation timed out")
            return Response(
                {
                    "detail": (
                        "FedEx no confirmó la respuesta. Verifica si creó el envío "
                        "antes de volver a intentarlo."
                    )
                },
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except requests.RequestException:
            logger.exception("FedEx shipment creation error")
            return Response(
                {
                    "detail": (
                        "No se pudo confirmar la creación en FedEx. Verifica si el "
                        "envío existe antes de volver a intentarlo."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except (ValueError, KeyError):
            logger.exception("FedEx shipment response could not be mapped")
            return Response(
                {
                    "detail": (
                        "FedEx respondió de forma inesperada. Verifica si el envío "
                        "existe antes de volver a intentarlo."
                    )
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )


class FedexEmailShipmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.FEDEX_SHIPMENT_CREATION_ENABLED:
            return Response(
                {"detail": "El envío de guías FedEx está desactivado para revisión."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = FedexEmailShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

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
        try:
            for index, label in enumerate(data["labels"], start=1):
                encoded = label.get("content_base64")
                if not isinstance(encoded, str):
                    raise ValueError("La etiqueta recibida no es válida.")
                if len(encoded) > 14 * 1024 * 1024:
                    raise ValueError("El tamaño de las etiquetas excede el límite permitido.")
                content = base64.b64decode(encoded, validate=True)
                total_size += len(content)
                if len(content) > 10 * 1024 * 1024 or total_size > 20 * 1024 * 1024:
                    raise ValueError("El tamaño de las etiquetas excede el límite permitido.")
                if not content.startswith(b"%PDF-"):
                    raise ValueError("El archivo recibido no es una etiqueta PDF válida.")

                filename = f"{data['cb_number']}-fedex-label-{index}.pdf"
                email.attach(filename, content, "application/pdf")
        except (ValueError, binascii.Error) as error:
            return Response({"detail": str(error)}, status=status.HTTP_400_BAD_REQUEST)

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