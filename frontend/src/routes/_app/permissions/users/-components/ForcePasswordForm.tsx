import { type SubmitEventHandler, useState } from "react";
import { toast } from "sonner";
import { useForceChangePasswordV1 } from "@/api/generated/default/default";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_LENGTH = 8;

export default function ForcePasswordForm({ userId }: { userId: number }) {
  const changePassword = useForceChangePasswordV1();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutSessions, setLogoutSessions] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    setErrorMessage(null);
    if (newPassword.length < MIN_LENGTH) {
      setErrorMessage(`新しいパスワードは${MIN_LENGTH}文字以上にしてください`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("確認用パスワードが一致しません");
      return;
    }

    changePassword.mutate(
      {
        id: String(userId),
        data: {
          newPassword,
          logoutSessions,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 204) {
            setNewPassword("");
            setConfirmPassword("");
            toast.success("パスワードを変更しました");
            return;
          }
          setErrorMessage("ユーザーが見つかりません");
        },
        onError: () => {
          setErrorMessage("パスワードの変更に失敗しました");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">パスワードの強制変更</h2>
        <p className="text-sm text-muted-foreground">
          現在のパスワードを知らなくても、このユーザーのパスワードを置き換えられます。
        </p>
      </div>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400"
        >
          {errorMessage}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="force-new-password">新しいパスワード</Label>
        <Input
          id="force-new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          minLength={MIN_LENGTH}
          disabled={changePassword.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="force-confirm-password">新しいパスワード（確認）</Label>
        <Input
          id="force-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={MIN_LENGTH}
          disabled={changePassword.isPending}
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id="logout-sessions"
            checked={logoutSessions}
            onCheckedChange={(value) => setLogoutSessions(value === true)}
            disabled={changePassword.isPending}
          />
          <Label htmlFor="logout-sessions" className="font-normal">
            対象ユーザーの全セッションからログアウトする
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          選ぶと、このユーザーのセッションをすべて無効にします。選ばないと、既存のセッションはそのまま残ります。
        </p>
      </div>
      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={changePassword.isPending}>
          パスワードを変更
        </Button>
      </div>
    </form>
  );
}
