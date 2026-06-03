import { createFileRoute } from "@tanstack/react-router";
import UserCreatePage from "@/features/users/components/UserCreatePage";

export const Route = createFileRoute("/_app/permissions/users/create")({
  component: UserCreatePage,
});
