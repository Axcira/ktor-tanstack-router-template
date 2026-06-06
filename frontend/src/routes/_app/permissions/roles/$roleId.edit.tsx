import { createFileRoute } from "@tanstack/react-router";
import RoleEditPage from "@/features/roles/components/RoleEditPage";

export const Route = createFileRoute("/_app/permissions/roles/$roleId/edit")({
  component: RoleEditPage,
});
