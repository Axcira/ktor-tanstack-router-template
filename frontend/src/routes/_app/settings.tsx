import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import AppearanceForm from "@/components/settings/AppearanceForm";
import PasswordForm from "@/components/settings/PasswordForm";
import { useAuthorize } from "@/hooks/useAuthorize";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="relative flex flex-col items-center bg-linear-to-b from-background to-muted/40 px-4 py-16 text-center">
      <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
        Settings
      </h1>
      <AppearanceForm />
      <PasswordSection />
    </div>
  );
}

function PasswordSection() {
  const { isAllowed, isLoading } = useAuthorize({ type: "ChangePassword" });

  if (isLoading) {
    return (
      <div className="mt-16 flex w-full max-w-md justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="mx-auto mt-16 w-full max-w-md space-y-2 rounded-xl border bg-card p-6 text-left shadow-sm">
        <h2 className="text-xl font-semibold">パスワード</h2>
        <p className="text-sm text-muted-foreground">
          自分のパスワードを変更するには「パスワードの変更」権限が必要です。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-16 w-full">
      <PasswordForm />
    </div>
  );
}
