import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"
import {
  type SubmitEventHandler,
  useState,
} from "react"
import { usePostAuthLogin } from "@/api/generated/default/default"

export const Route = createFileRoute("/login")({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const loginMutation = usePostAuthLogin()

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault()
    loginMutation.mutate({data: {email, password}}, {
      onSuccess: () => {
        alert("ログインに成功しました")
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
          <label className="block text-sm font-medium text-gray-700" htmlFor="email">メールアドレス</label>
          <input
            id={"email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="password">パスワード</label>
          <input
            id={"password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loginMutation.isPending ? "ログイン中..." : "ログイン"}
        </button>
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
