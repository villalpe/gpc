from rest_framework.permissions import BasePermission

from core.company_context import get_active_company_id

from .models import Membership, Role

MODULE_ROLE_MATRIX = {
    "audit": {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.VIEWER},
    "inventory": {Role.SUPERADMIN, Role.ADMIN_COMPANY, Role.OPERATOR},
}

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return Membership.objects.filter(
            user=request.user,
            is_active=True,
            role=Role.SUPERADMIN
        ).exists()


class IsCompanyAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return Membership.objects.filter(
            user=request.user,
            is_active=True,
            role__in=[Role.SUPERADMIN, Role.ADMIN_COMPANY]
        ).exists()

def user_role_for_company(user, company_id):
    m = Membership.objects.filter(
        user=user, company_id=company_id, is_active=True
    ).first()
    return m.role if m else None


class HasModuleAccess(BasePermission):
    module = None  # override

    def has_permission(self, request, view):
        if not self.module:
            return False

        company_id = get_active_company_id(request)
        role = user_role_for_company(request.user, company_id)
        if not role:
            return False

        return role in MODULE_ROLE_MATRIX.get(self.module, set())


class CanAccessAudit(HasModuleAccess):
    module = "audit"


class CanAccessInventory(HasModuleAccess):
    module = "inventory"        