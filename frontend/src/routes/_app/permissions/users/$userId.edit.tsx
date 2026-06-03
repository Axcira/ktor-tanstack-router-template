import { createFileRoute } from "@tanstack/react-router";
import UserEditPage from "@/features/users/components/UserEditPage";

export const Route = createFileRoute("/_app/permissions/users/$userId/edit")({
  component: UserEditPage,
});
