from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.services import log_event
from core.company_context import require_company_membership

from .permission_service import list_permissions_for_user_company


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    try:
        company_id = require_company_membership(request)
    except ValidationError as e:
        log_event(
            request=request,
            action="accounts.permissions.read",
            status="denied",
            message="Missing or invalid X-Company-Id",
        )
        detail = str(e.detail[0]) if hasattr(e, "detail") else str(e)
        return Response(
            {"detail": detail},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except PermissionDenied:
        log_event(
            request=request,
            action="accounts.permissions.read",
            status="denied",
            message="User does not belong to this company",
        )
        return Response(
            {"detail": "You do not belong to this company"},
            status=status.HTTP_403_FORBIDDEN,
        )

    permissions = list_permissions_for_user_company(request.user, company_id)

    log_event(
        request=request,
        action="accounts.permissions.read",
        status="success",
        company_id=company_id,
        metadata={"permissions_count": len(permissions)},
    )
    return Response({"permissions": permissions})