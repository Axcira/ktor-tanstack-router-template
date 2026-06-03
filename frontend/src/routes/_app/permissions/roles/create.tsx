import { createFileRoute } from "@tanstack/react-router";
import RoleCreatePage from "@/features/roles/components/RoleCreatePage";

export const Route = createFileRoute("/_app/permissions/roles/create")({
  component: RoleCreatePage,
});
