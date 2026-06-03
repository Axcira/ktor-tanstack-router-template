import { createFileRoute } from "@tanstack/react-router";
import RolesPage from "@/features/roles/components/RolesPage";

export const Route = createFileRoute("/_app/permission/roles")({
  component: RolesPage,
});
