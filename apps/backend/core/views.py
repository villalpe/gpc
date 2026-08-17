from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsSuperAdmin, CanAccessAudit, CanAccessInventory
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