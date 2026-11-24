import logging
import smtplib
from datetime import timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.core.validators import validate_email
from django.db.models import Q
from django.utils import timezone

from .models import FedexShipment

logger = logging.getLogger(__name__)
GROUP_LABELS = {
    "sender": "Remitente",
    "recipient": "Destinatario",
    "other": "Otro",
    "requester": "Posterior a la creación",
}


def send_creation_notification(shipment):
    """Claim an attempt without holding a database transaction during SMTP."""
    now = timezone.now()
    claimed = FedexShipment.objects.filter(
        pk=shipment.pk,
        status=FedexShipment.Status.CREATED,
    ).filter(
        Q(notification_status__in=[
            FedexShipment.NotificationStatus.PENDING,
            FedexShipment.NotificationStatus.FAILED,
        ]) | Q(
            notification_status=FedexShipment.NotificationStatus.SENDING,
            notification_attempted_at__lt=now - timedelta(minutes=5),
        )
    ).update(
        notification_status=FedexShipment.NotificationStatus.SENDING,
        notification_attempted_at=now,
        notification_error="",
    )
    if not claimed:
        shipment.refresh_from_db()
        return False

    try:
        address = settings.FEDEX_CREATION_NOTIFICATION_TEST_EMAIL.strip()
        if settings.FEDEX_BASE_URL.rstrip("/") != "https://apis-sandbox.fedex.com":
            raise ValueError("Los avisos de prueba requieren FedEx sandbox.")
        if not address:
            raise ValueError("Falta configurar la dirección de prueba.")
        validate_email(address)
        if not all((settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD,
                    settings.DEFAULT_FROM_EMAIL)):
            raise ValueError("Falta configurar el correo del backend.")
        sender = shipment.shipment_data["sender"]["company_name"]
        recipient = shipment.shipment_data["recipient"]["company_name"]
        groups = ", ".join(GROUP_LABELS[group] for group in shipment.notification_groups)
        email = EmailMessage(
            subject=f"PRUEBA: envío FedEx creado - {shipment.cb_number}",
            body=(
                "Aviso de prueba; no se ha enviado a los contactos reales.\n\n"
                f"Preferencias seleccionadas: {groups}\n"
                f"CB: {shipment.cb_number}\nGuía: {shipment.tracking_number}\n"
                f"Remitente: {sender}\nDestinatario: {recipient}\n"
                f"Servicio FedEx: {shipment.service_type}\n"
            ),
            to=[address],
        )
        if email.send(fail_silently=False) != 1:
            raise ValueError("El servidor de correo no confirmó el envío.")
    except (ValidationError, ValueError) as error:
        logger.warning(
            "FedEx creation notification configuration invalid for shipment %s", shipment.pk
        )
        if isinstance(error, ValidationError):
            detail = "La dirección de prueba configurada no es válida."
        else:
            detail = str(error)
        status = FedexShipment.NotificationStatus.FAILED
    except (smtplib.SMTPException, OSError):
        logger.exception(
            "FedEx creation notification was not confirmed for shipment %s", shipment.pk
        )
        detail = (
            "No se pudo confirmar el envío SMTP. Revisa la configuración y la bandeja de prueba."
        )
        status = FedexShipment.NotificationStatus.FAILED
    else:
        status = FedexShipment.NotificationStatus.SENT
        detail = ""
    FedexShipment.objects.filter(
        pk=shipment.pk,
        notification_status=FedexShipment.NotificationStatus.SENDING,
        notification_attempted_at=now,
    ).update(notification_status=status, notification_error=detail)
    shipment.refresh_from_db()
    return True
