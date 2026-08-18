from typing import Optional
from .models import Membership
from .permissions_matrix import ROLE_PERMISSIONS

def get_user_role_in_company(user, company_id) -> Optional[str]:
    membership = (
        Membership.objects
        .filter(user=user, company_id=company_id, is_active=True)
        .only("role")
        .first()
    )
    return membership.role if membership else None

def has_feature_permission(user, company_id, permission_key: str) -> bool:
    role = get_user_role_in_company(user, company_id)
    if not role:
        return False
    allowed = ROLE_PERMISSIONS.get(role, set())
    return permission_key in allowed

def list_permissions_for_user_company(user, company_id):
    role = get_user_role_in_company(user, company_id)
    if not role:
        return []
    return sorted(list(ROLE_PERMISSIONS.get(role, set())))