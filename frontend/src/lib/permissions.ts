import { canI } from "@/api/generated/default/default.ts";
import type { Permission, UserSession } from "@/api/generated/schemas";

type StaticPermission = {
  [K in Permission["type"]]: Extract<Permission, { type: K }> extends {
    type: K;
  } & infer Rest
    ? keyof Rest extends never
      ? Extract<Permission, { type: K }>
      : never
    : never;
}[Permission["type"]];

function isStaticPermission(
  permission: Permission,
): permission is StaticPermission {
  return Object.keys(permission).length === 1;
}

export async function checkPermission(
  session: UserSession,
  permission: Permission,
): Promise<boolean> {
  if (isStaticPermission(permission)) {
    if (session.permissions.some((p) => p.type === permission.type)) {
      // static permissions can be checked locally
      return true;
    }
    // some permissions (ManageArticle etc.) are compound of some Articles-related permissions,
    // so we can't return here. We still need to fetch the server about permission and authorize
  }

  try {
    const canIResponse = await canI(permission);
    console.log("canIResponse", canIResponse);
    return canIResponse.status === 200;
  } catch (error) {
    console.error("Permission check failed", error);
    return false;
  }
}
