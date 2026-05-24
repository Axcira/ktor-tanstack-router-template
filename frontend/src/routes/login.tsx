import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"
import {
  type SubmitEventHandler,
  useState,
} from "react"
import { useLogin } from "#/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const loginMutation = useLogin()
  const navigate = useNavigate()

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault()
    loginMutation.mutate({data: {email, password}}, {
      onSuccess: (data) => {
        if (data.status === 401) {
          alert("メールアドレスまたはパスワードが間違っています")
          return
        }
        alert("ログインに成功しました")
        navigate({to: "/"}).then()
        return
      }, onError: () => {
        alert("ログインに失敗しました")
      },
    })
  }

  return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="block text-sm font-medium">メールアドレス
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
          <Label className="block text-sm font-medium">パスワード
            <Input
              type={"password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label={"パスワード"}
            />
          </Label>
        </div>
        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className={"w-full"}
        >
          {loginMutation.isPending ? "ログイン中..." : "ログイン"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">
          アカウントをお持ちでない方はこちら
        </Link>
      </div>
      <div className="mt-2 text-center">
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-500">
          ホームに戻る
        </Link>
      </div>
    </div>
  </div>)
}
