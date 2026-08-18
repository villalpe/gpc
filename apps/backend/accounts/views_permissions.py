from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .permission_service import list_permissions_for_user_company
from audit.services import log_event


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    company_id = request.headers.get("X-Company-Id")
    if not company_id:
        log_event(
            request=request,
            action="accounts.permissions.read",
            status="denied",
            message="Missing X-Company-Id",
        )
        return Response({"detail": "X-Company-Id header required"}, status=400)

    permissions = list_permissions_for_user_company(request.user, company_id)

    log_event(
        request=request,
        action="accounts.permissions.read",
        status="success",
        company_id=company_id,
        metadata={"permissions_count": len(permissions)},
    )
    return Response({"permissions": permissions})