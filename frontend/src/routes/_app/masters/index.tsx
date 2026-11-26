import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkPermission } from "@/lib/permissions";
import { MASTER_TABS } from "./-components/masters";

export const Route = createFileRoute("/_app/masters/")({
  beforeLoad: async ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/dashboard" });
    }
    for (const tab of MASTER_TABS) {
      if (await checkPermission(context.session, tab.permission)) {
        throw redirect({ to: tab.to });
      }
    }
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});
