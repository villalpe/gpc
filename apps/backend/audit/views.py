from django.core.exceptions import PermissionDenied, ValidationError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import Role, user_role_for_company
from audit.models import AuditEvent
from core.company_context import require_company_membership


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_events_list(request):
    try:
        company_id = require_company_membership(request)
    except ValidationError:
        return Response(
            {"detail": "X-Company-Id header is required and must be a valid UUID"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except PermissionDenied:
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    role = user_role_for_company(request.user, company_id)
    if role not in {Role.SUPERADMIN, Role.ADMIN_COMPANY}:
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    events = AuditEvent.objects.filter(company_id=company_id).order_by("-created_at")[:100]

    return Response(
        [
            {
                "id": str(e.id),
                "company_id": str(e.company_id) if e.company_id else None,
                "action": e.action,
                "status": e.status,
                "message": e.message,
                "user_id": str(e.user_id) if e.user_id else None,
                "metadata": e.metadata,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
    )