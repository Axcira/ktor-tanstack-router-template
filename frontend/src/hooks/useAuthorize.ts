import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@/api/generated/schemas";
import { checkAnyPermission } from "@/lib/permissions";
import { Route } from "@/routes/_app";

export function useAuthorize(
  permission?: Permission | Permission[],
  options?: Omit<Parameters<typeof useQuery>[1], "queryKey">,
) {
  const { session } = Route.useRouteContext();
  const permissions = Array.isArray(permission)
    ? permission
    : permission
      ? [permission]
      : [];
  const enabled = !!session && permissions.length > 0;

  const { data, ...rest } = useQuery({
    ...options,
    queryKey: [
      "authorize",
      session,
      ...permissions.flatMap((p) => [p.type, { ...p }]),
    ],
    queryFn: () => {
      if (permissions.length === 0) throw new Error("permission is required");
      return checkAnyPermission(session, permissions);
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 30,
    enabled,
  });

  return {
    isAllowed: permissions.length > 0 ? (data ?? false) : true,
    ...rest,
  };
}
