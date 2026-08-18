from .models import Role

ROLE_PERMISSIONS = {
    Role.SUPERADMIN: {
        "inventory.read",
        "inventory.write",
        "inventory.adjust",
        "audit.read",
        "users.invite",
        "users.disable",
    },
    Role.ADMIN_COMPANY: {
        "inventory.read",
        "inventory.write",
        "inventory.adjust",
        "audit.read",
        "users.invite",
    },
    Role.OPERATOR: {
        "inventory.read",
        "inventory.write",
    },
    Role.VIEWER: {
        "inventory.read",
        "audit.read",
    },
}