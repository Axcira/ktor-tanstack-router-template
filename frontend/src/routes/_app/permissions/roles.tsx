import { createFileRoute, redirect } from "@tanstack/react-router";
import RolesPage from "@/features/roles/components/RolesPage";
import { checkPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_app/permissions/roles")({
  beforeLoad: async ({ context }) => {
    if (!context.session || !(await checkPermission(context.session, { type: "ManageUsers" }))) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RolesPage,
});
