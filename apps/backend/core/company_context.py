from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.models import Membership


def get_active_company_id(request):
    company_id = request.headers.get("X-Company-Id")
    if not company_id:
        raise ValidationError("Missing X-Company-Id header")
    return company_id


def require_company_membership(request):
    company_id = get_active_company_id(request)

    is_member = Membership.objects.filter(
        user=request.user,
        company_id=company_id,
        is_active=True
    ).exists()

    if not is_member:
        raise PermissionDenied("You do not belong to this company")

    return company_id