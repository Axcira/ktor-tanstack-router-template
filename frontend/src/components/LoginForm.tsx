import { Link, useNavigate } from "@tanstack/react-router";
import { type SubmitEventHandler, useState } from "react";
import { toast } from "sonner";
import { useLoginV1 } from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLoginV1();
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.status === 401) {
            setErrorMessage("メールアドレスまたはパスワードが間違っています");
            return;
          }
          toast.success("ログインに成功しました");
          navigate({ to: "/" }).then();
        },
        onError: () => {
          setErrorMessage("ログインに失敗しました");
        },
      },
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-400"
            >
              {errorMessage}
            </div>
          )}
          <div>
            <Label className="block text-sm font-medium mb-1.5">
              メールアドレス
              <Input
                type={"email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label={"メールアドレス"}
                className="mt-1"
              />
            </Label>
          </div>
          <div>
            <Label className="block text-sm font-medium mb-1.5">
              パスワード
              <Input
                type={"password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label={"パスワード"}
                className="mt-1"
              />
            </Label>
          </div>
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className={"w-full mt-2"}
          >
            {loginMutation.isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
