import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";
import { loadSession } from "@/lib/self";

type LoginSearch = {
  addAccount?: boolean;
};

export async function guardLogin(addAccount: boolean) {
  if (addAccount) return;
  if (await loadSession()) {
    throw redirect({ to: "/dashboard" });
  }
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const addAccount =
      search.addAccount === true || search.addAccount === "true";
    return addAccount ? { addAccount: true } : {};
  },
  beforeLoad: async ({ search }) => {
    await guardLogin(search.addAccount === true);
  },
  component: LoginPage,
});

function LoginPage() {
  const { addAccount } = Route.useSearch();
  return <LoginForm addAccount={addAccount === true} />;
}
