import { type SubmitEventHandler, useState } from "react";
import { ApiError } from "@/api/client";
import { useChangePasswordV1 } from "@/api/generated/default/default";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { formErrorBannerClass } from "@/lib/theme-tokens";

const MIN_LENGTH = 8;

export default function PasswordForm() {
  const changePassword = useChangePasswordV1();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    setErrorMessage(null);
    if (
      currentPassword.length < MIN_LENGTH ||
      newPassword.length < MIN_LENGTH
    ) {
      setErrorMessage(`パスワードは${MIN_LENGTH}文字以上にしてください`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("確認用パスワードが一致しません");
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage("現在のパスワードとは別のパスワードにしてください");
      return;
    }

    changePassword.mutate(
      {
        data: {
          currentPassword,
          newPassword,
          logoutOtherSessions,
        },
      },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast.add({ type: "success", title: "パスワードを変更しました" });
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 401) {
              setErrorMessage("現在のパスワードが違います");
              return;
            }
            const reasons = (error.data as { reasons?: string[] } | undefined)
              ?.reasons;
            if (reasons?.length) {
              setErrorMessage(reasons.join("\n"));
              return;
            }
          }
          setErrorMessage("パスワードの変更に失敗しました");
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-left shadow-sm"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">パスワード</h2>
        <p className="text-sm text-muted-foreground">
          現在のパスワードを確認してから変更します。
        </p>
      </div>
      {errorMessage && (
        <div role="alert" className={formErrorBannerClass()}>
          {errorMessage}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="current-password">現在のパスワード</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          minLength={MIN_LENGTH}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-password">新しいパスワード</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={MIN_LENGTH}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">新しいパスワード（確認）</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={MIN_LENGTH}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="logout-other-sessions"
          checked={logoutOtherSessions}
          onCheckedChange={(value) => setLogoutOtherSessions(value === true)}
        />
        <Label htmlFor="logout-other-sessions" className="font-normal">
          他のセッションからログアウトする
        </Label>
      </div>
      <Button type="submit" disabled={changePassword.isPending}>
        パスワードを変更
      </Button>
    </form>
  );
}
