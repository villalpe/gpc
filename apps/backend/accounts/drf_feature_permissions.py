from rest_framework.permissions import BasePermission
from .permission_service import has_feature_permission

class HasFeaturePermission(BasePermission):
    required_permission = None  # override en subclasses

    def has_permission(self, request, view):
        company_id = request.headers.get("X-Company-Id")
        if not company_id or not self.required_permission:
            return False
        return has_feature_permission(request.user, company_id, self.required_permission)


class CanInventoryRead(HasFeaturePermission):
    required_permission = "inventory.read"

class CanInventoryWrite(HasFeaturePermission):
    required_permission = "inventory.write"

class CanAuditRead(HasFeaturePermission):
    required_permission = "audit.read"