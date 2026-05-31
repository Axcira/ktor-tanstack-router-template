import type { Permission } from "@/api/generated/schemas";

function hasPermission<TType extends Permission["type"]>(permissions: Permission[], type: TType, predicate?: (permission: Extract<Permission, {
  type: TType
}>) => boolean): boolean {
  return permissions.some(permission => {
    if (permission.type !== type) {
      return false;
    }

    if (!predicate) {
      return true;
    }

    return predicate(permission as Extract<Permission, { type: TType }>);
  });
}
