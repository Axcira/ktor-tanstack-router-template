import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"
import { useGetUsersMe } from "@/api/generated/default/default"

export const Route = createFileRoute("/")({component: Home})

function Home() {
  const {data, isLoading, isError} = useGetUsersMe()

  if (isLoading) return <div>Loading...</div>

  return (<div className="p-8">
    <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
    <p className="mt-4 text-lg">
      Edit <code>src/routes/index.tsx</code> to get started.
    </p>


    {isError ? (<div className="mt-8 space-x-4">
      <Link
        to="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        ログイン
      </Link>
      <Link
        to="/register"
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        アカウント登録
      </Link>
    </div>) : (<div className="mt-8">
      <p className="mb-4">Logged in as {data?.data.email}</p>
    </div>)}
  </div>)
}
