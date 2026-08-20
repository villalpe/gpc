export type Permission =
  | "inventory.read"
  | "inventory.write"
  | "inventory.adjust"
  | "audit.read"
  | "users.invite"
  | "users.disable";

export function hasPermission(
  permissions: string[] | undefined,
  required: Permission | Permission[]
): boolean {
  if (!permissions) return false;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((p) => permissions.includes(p));
}