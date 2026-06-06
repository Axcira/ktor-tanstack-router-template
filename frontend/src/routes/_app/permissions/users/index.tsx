import { createFileRoute } from "@tanstack/react-router";
import UsersPage from "@/features/users/components/UsersPage";

export const Route = createFileRoute("/_app/permissions/users/")({
  component: UsersPage,
});
