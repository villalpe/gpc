from django.utils.dateparse import parse_datetime
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from audit.models import AuditEvent
from accounts.permission_service import get_user_role_in_company


ALLOWED_ROLES = {"SUPERADMIN", "ADMIN_COMPANY"}


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_events_list(request):
    company_id = request.query_params.get("company_id") or request.headers.get("X-Company-Id")
    if not company_id:
        return Response({"detail": "company_id query param or X-Company-Id header required"}, status=400)

    role = get_user_role_in_company(request.user, company_id)
    if role not in ALLOWED_ROLES:
        return Response({"detail": "Forbidden"}, status=403)

    qs = AuditEvent.objects.filter(company_id=company_id).order_by("-created_at")

    action = request.query_params.get("action")
    if action:
        qs = qs.filter(action=action)

    dt_from = request.query_params.get("from")
    if dt_from:
        parsed = parse_datetime(dt_from)
        if not parsed:
            return Response({"detail": "Invalid 'from' datetime format (ISO 8601 required)"}, status=400)
        qs = qs.filter(created_at__gte=parsed)

    dt_to = request.query_params.get("to")
    if dt_to:
        parsed = parse_datetime(dt_to)
        if not parsed:
            return Response({"detail": "Invalid 'to' datetime format (ISO 8601 required)"}, status=400)
        qs = qs.filter(created_at__lte=parsed)

    try:
        limit = int(request.query_params.get("limit", 50))
    except ValueError:
        return Response({"detail": "limit must be integer"}, status=400)

    limit = max(1, min(limit, 200))
    rows = qs[:limit]

    data = [
        {
            "id": str(r.id),
            "created_at": r.created_at.isoformat(),
            "request_id": r.request_id,
            "company_id": str(r.company_id) if r.company_id else None,
            "user_id": str(r.user_id) if r.user_id else None,
            "action": r.action,
            "status": r.status,
            "message": r.message,
            "ip": r.ip,
            "method": r.method,
            "path": r.path,
            "metadata": r.metadata,
        }
        for r in rows
    ]

    return Response({"count": len(data), "results": data})