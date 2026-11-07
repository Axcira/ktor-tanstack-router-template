import { queryOptions } from "@tanstack/react-query";
import { getSelfV1 } from "@/api/generated/default/default";
import { queryClient } from "@/routes/__root";

export const selfQueryOptions = queryOptions({
  queryKey: ["self"],
  queryFn: async () => {
    const self = await getSelfV1();
    if (self.status === 200) return self.data;
    throw new Error("Failed to fetch self data");
  },
  staleTime: 1000 * 60,
});

export async function loadSession() {
  try {
    return await queryClient.ensureQueryData(selfQueryOptions);
  } catch {
    return null;
  }
}
