import type { Permission } from "@/api/generated/schemas";
import type { UserSession } from "@/api/generated/schemas/userSession";

export function makeSession(
  permissions: Permission[] = [],
  overrides?: Partial<UserSession["user"]>,
): UserSession {
  return {
    user: {
      id: 1,
      email: "test@example.com",
      roleId: 1,
      ...overrides,
    },
    permissions,
  };
}
