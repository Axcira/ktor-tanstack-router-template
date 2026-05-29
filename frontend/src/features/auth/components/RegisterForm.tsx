import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUser } from "@/api/generated/default/default.ts";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const registerMutation = useCreateUser();
  const navigate = useNavigate();

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }
    registerMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.status === 201) {
            alert("アカウント登録に成功しました");
            navigate({ to: "/" }).then();
            return;
          }
        },
        onError: () => {
          alert("アカウント登録に失敗しました");
        },
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 bg-card text-card-foreground border border-border rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">アカウント登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <Label className="block text-sm font-medium mb-1.5">
              パスワード（確認）
              <Input
                type={"password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label={"パスワード（確認）"}
                className="mt-1"
              />
            </Label>
          </div>
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className={"w-full mt-2"}
          >
            {registerMutation.isPending ? "登録中..." : "登録"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            すでにアカウントをお持ちの方はこちら
          </Link>
        </div>
        <div className="mt-3 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}