import { Route } from '../routes/_app';
import { checkPermission } from "@/lib/permissions";
import { useQuery } from "@tanstack/react-query";
import type { Permission } from "@/api/generated/schemas";

export function useAuthorize(action: Permission["type"], params?: Record<string, any>) {
  const { session } = Route.useRouteContext();

  const {data, ...rest} = useQuery({
    queryKey: ['authorize', action, params],

    queryFn: () => checkPermission(session, action, params),

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,

    enabled: !!session,
  });

  return {
    isAllowed: data ?? false,
    ...rest,
  };
}
