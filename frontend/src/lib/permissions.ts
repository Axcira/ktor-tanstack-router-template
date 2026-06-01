import type {
  Permission,
  UserSession,
} from "@/api/generated/schemas";
import { canI } from "@/api/generated/default/default.ts";

export async function checkPermission(
  session: UserSession,
  action: Permission["type"],
  params?: Record<string, any>
): Promise<boolean> {
  if (!params) {
    const hasStaticPermission = session.permissions.some((p) => p.type === action);
    if (hasStaticPermission) return true;
  }

  try {
    const canIResponse = await canI({
      type: action,
      ...params as any
    }, {

    });

    return canIResponse.status === 200;
  } catch (error) {
    console.error('Permission check failed', error);
    return false;
  }
}
