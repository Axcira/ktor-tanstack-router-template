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
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <AppearanceForm />
      <PasswordSection />
    </div>
  );
}

function PasswordSection() {
  const { isAllowed, isLoading } = useAuthorize({ type: "ChangePassword" });

  if (isLoading) {
    return (
      <div className="flex w-full max-w-md justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="w-full max-w-md space-y-2 rounded-lg border bg-card p-6 text-left shadow-sm">
        <h2 className="text-xl font-semibold">パスワード</h2>
        <p className="text-sm text-muted-foreground">
          自分のパスワードを変更するには「パスワードの変更」権限が必要です。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PasswordForm />
    </div>
  );
}
