from .models import Role

ROLE_PERMISSIONS = {
    Role.SUPERADMIN: {
        "inventory.read",
        "inventory.write",
        "inventory.adjust",
        "audit.read",
        "users.invite",
        "users.disable",
        "quotes.read",
        "quotes.create",
        "quotes.view_price",
    },
    Role.ADMIN_COMPANY: {
        "inventory.read",
        "inventory.write",
        "inventory.adjust",
        "audit.read",
        "users.invite",
        "quotes.read",
        "quotes.create",
        "quotes.view_price",
    },
    Role.OPERATOR: {
        "inventory.read",
        "inventory.write",
        "quotes.read",
        "quotes.create",
        "quotes.view_price",
    },
    Role.VIEWER: {
        "inventory.read",
        "audit.read",
        "quotes.read",
        "quotes.create",
    },
    Role.CLIENT: {
        "quotes.read",
        "quotes.create",
    },
}