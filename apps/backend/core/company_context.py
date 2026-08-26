import uuid

from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.models import Membership


def get_active_company_id(request):
    raw_company_id = request.headers.get("X-Company-Id")
    if not raw_company_id:
        raise ValidationError("Missing X-Company-Id header")

    try:
        # normaliza y valida formato UUID
        company_id = str(uuid.UUID(str(raw_company_id)))
    except (ValueError, TypeError):
        raise ValidationError("Invalid X-Company-Id format")

    return company_id


def require_company_membership(request):
    company_id = get_active_company_id(request)

    is_member = Membership.objects.filter(
        user=request.user,
        company_id=company_id,
        is_active=True,
    ).exists()

    if not is_member:
        raise PermissionDenied("You do not belong to this company")

    return company_id