import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";
import { loadSession } from "@/lib/self";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    if (await loadSession()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginForm,
});
