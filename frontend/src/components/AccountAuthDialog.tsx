import { type SubmitEventHandler, useEffect, useState } from "react";
import { ApiError } from "@/api/client";
import { useLoginV1 } from "@/api/generated/default/default";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  accountNavigation,
  isAccountLimitReached,
  isSessionSuperseded,
} from "@/lib/authuser";
import { formErrorBannerClass } from "@/lib/theme-tokens";

const ACCOUNT_LIMIT_MESSAGE =
  "このブラウザには既に10個のアカウントがサインインしています。どれか一つからサインアウトしてから追加してください。";

export function AccountAuthDialog({
  open,
  mode,
  email,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  mode: "add" | "reauth";
  email: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: (accountIndex: number) => void;
}) {
  const [draftEmail, setDraftEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLoginV1();
  const reauth = mode === "reauth";
  const emailValue = reauth ? email : draftEmail;

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setErrorMessage(null);
    if (!reauth) setDraftEmail("");
  }, [open, reauth]);

  const handleSubmit: SubmitEventHandler = (event) => {
    event.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate(
      { data: { email: emailValue, password, addAccount: true } },
      {
        onSuccess: (data) => {
          onSuccess(data.data.accountIndex);
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            isSessionSuperseded(error.status, error.data)
          ) {
            accountNavigation.assign("/dashboard");
            return;
          }
          if (
            error instanceof ApiError &&
            isAccountLimitReached(error.status, error.data)
          ) {
            setErrorMessage(ACCOUNT_LIMIT_MESSAGE);
            return;
          }
          if (error instanceof ApiError && error.status === 401) {
            setErrorMessage("メールアドレスまたはパスワードが間違っています");
            return;
          }
          setErrorMessage("ログインに失敗しました");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {reauth ? "再ログイン" : "アカウントを追加"}
          </DialogTitle>
          <DialogDescription>
            {reauth
              ? "このアカウントはサインインし直す必要があります。"
              : "別のアカウントをこのブラウザに追加します。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage ? (
            <div role="alert" className={formErrorBannerClass("p-3")}>
              {errorMessage}
            </div>
          ) : null}
          <div>
            <Label className="block text-sm font-medium mb-1.5">
              メールアドレス
              <Input
                type="email"
                value={emailValue}
                onChange={(event) => setDraftEmail(event.target.value)}
                readOnly={reauth}
                required
                aria-label="メールアドレス"
                className="mt-1"
              />
            </Label>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1.5">
              パスワード
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                aria-label="パスワード"
                className="mt-1"
              />
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending
                ? "ログイン中..."
                : reauth
                  ? "ログイン"
                  : "アカウントを追加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
