import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@/api/generated/schemas";
import { checkPermission } from "@/lib/permissions";
import { Route } from "../routes/_app";

export function useAuthorize(permission: Permission, options?: Omit<Parameters<typeof useQuery>[1], "queryKey">) {
  const {session} = Route.useRouteContext();

  const {data, ...rest} = useQuery({
    queryKey: ["authorize", permission.type, {...permission}],
    queryFn: () => checkPermission(session, permission),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!session, ...options,
  });

  return {
    isAllowed: data ?? false, ...rest,
  };
}
