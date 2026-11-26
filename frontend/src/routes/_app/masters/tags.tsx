import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkPermission } from "@/lib/permissions";
import { TagMasterTable } from "./-components/tags/TagMasterTable";

export const Route = createFileRoute("/_app/masters/tags")({
  beforeLoad: async ({ context }) => {
    if (
      !context.session ||
      !(await checkPermission(context.session, {
        type: "ManageMasters",
        masterId: "tags",
      }))
    ) {
      throw redirect({ to: "/masters" });
    }
  },
  component: TagMasterTable,
});
