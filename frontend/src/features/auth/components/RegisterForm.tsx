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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">アカウント登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="block text-sm font-medium">
              メールアドレス
              <Input
                type={"email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label={"メールアドレス"}
              />
            </Label>
          </div>
          <div>
            <Label className="block text-sm font-medium">
              パスワード
              <Input
                type={"password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label={"パスワード"}
              />
            </Label>
          </div>
          <div>
            <Label className="block text-sm font-medium">
              パスワード（確認）
              <Input
                type={"password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-label={"パスワード（確認）"}
              />
            </Label>
          </div>
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className={"w-full"}
          >
            {registerMutation.isPending ? "登録中..." : "登録"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            すでにアカウントをお持ちの方はこちら
          </Link>
        </div>
        <div className="mt-2 text-center">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-500">
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
