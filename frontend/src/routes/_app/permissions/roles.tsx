import { createFileRoute } from "@tanstack/react-router";
import RolesPage from "@/features/roles/components/RolesPage";

export const Route = createFileRoute("/_app/permissions/roles")({
  component: RolesPage,
});
