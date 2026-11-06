import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { type SubmitEventHandler, useState } from "react";
import { ApiError } from "@/api/client";
import { useLoginV1 } from "@/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { selfQueryOptions } from "@/lib/self";
import { formErrorBannerClass } from "@/lib/theme-tokens";
import { queryClient } from "@/routes/__root";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loginMutation = useLoginV1();
  const navigate = useNavigate();
  const hookQueryClient = useQueryClient();

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          queryClient.clear();
          hookQueryClient.clear();
          queryClient.setQueryData(selfQueryOptions.queryKey, data.data);
          hookQueryClient.setQueryData(selfQueryOptions.queryKey, data.data);
          toast.add({ type: "success", title: "ログインに成功しました" });
          navigate({ to: "/dashboard" }).then();
        },
        onError: (error) => {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground border border-border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div role="alert" className={formErrorBannerClass("p-3")}>
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
