from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permission_service import has_feature_permission
from accounts.permissions import CanAccessAudit, CanAccessInventory, IsSuperAdmin
from audit.services import log_event
from core.company_context import require_company_membership


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "gpc-backend"})


@api_view(["GET"])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def admin_ping(request):
    return Response({"ok": True, "message": "Hola SUPERADMIN"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def company_scope_ping(request):
    company_id = require_company_membership(request)
    return Response({"ok": True, "company_id": company_id})


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanAccessAudit])
def audit_module_ping(request):
    return Response({"ok": True, "module": "audit"})


@api_view(["GET"])
@permission_classes([IsAuthenticated, CanAccessInventory])
def inventory_module_ping(request):
    return Response({"ok": True, "module": "inventory"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def inventory_adjust(request):
    sku = request.data.get("sku")
    delta = request.data.get("delta")

    try:
        company_id = require_company_membership(request)
    except ValidationError as e:
        log_event(
            request=request,
            action="inventory.adjust",
            status="denied",
            message="Missing or invalid X-Company-Id",
            metadata={"sku": sku, "delta": delta},
        )
        return Response(
            {"detail": str(e.detail[0]) if hasattr(e, "detail") else str(e)},
            status=400,
        )
    except PermissionDenied:
        log_event(
            request=request,
            action="inventory.adjust",
            status="forbidden",
            message="User does not belong to this company",
            metadata={"sku": sku, "delta": delta},
        )
        return Response({"detail": "You do not belong to this company"}, status=403)

    try:
        if not has_feature_permission(request.user, company_id, "inventory.adjust"):
            log_event(
                request=request,
                action="inventory.adjust",
                status="forbidden",
                message="Permission denied",
                company_id=company_id,
                metadata={"sku": sku, "delta": delta},
            )
            return Response({"detail": "Forbidden"}, status=403)

        # Ajuste (dummy en esta etapa)
        log_event(
            request=request,
            action="inventory.adjust",
            status="success",
            message="Inventory adjusted",
            company_id=company_id,
            metadata={"sku": sku, "delta": delta},
        )
        return Response({"ok": True, "sku": sku, "delta": delta}, status=200)

    except Exception as ex:
        log_event(
            request=request,
            action="inventory.adjust",
            status="error",
            message=str(ex)[:300],
            company_id=company_id,
            metadata={"sku": sku, "delta": delta},
        )
        return Response({"detail": "Internal error"}, status=500)