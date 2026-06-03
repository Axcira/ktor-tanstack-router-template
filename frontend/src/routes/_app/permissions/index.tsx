import { createFileRoute } from "@tanstack/react-router";
import PermissionManager from "@/components/PermissionForm.tsx";

export const Route = createFileRoute("/_app/permissions/")({
  component: () => <PermissionManager />,
});
