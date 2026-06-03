import { createFileRoute, redirect } from "@tanstack/react-router";
import PermissionManager from "@/components/PermissionForm.tsx";
import { checkPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_app/permissions/")({
  beforeLoad: async ({ context }) => {
    if (!context.session || !(await checkPermission(context.session, { type: "ManageUsers" }))) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: () => <PermissionManager />,
});
