import { createFileRoute, redirect } from "@tanstack/react-router";
import UsersPage from "@/features/users/components/UsersPage";
import { checkPermission } from "@/lib/permissions";

export const Route = createFileRoute("/_app/permissions/users")({
  beforeLoad: async ({ context }) => {
    if (!context.session || !(await checkPermission(context.session, { type: "ManageUsers" }))) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: UsersPage,
});
