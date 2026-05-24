import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"
import { useGetUsersMe } from "@/api/generated/default/default"
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({component: Home})

function Home() {
  const {data, isLoading, isError} = useGetUsersMe()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div className={"text-red-500"}>An internal error occurred. Check your internet connection and try again later.</div>

  return (<div className="p-8">
    <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
    <p className="mt-4 text-lg">
      Edit <code>src/routes/index.tsx</code> to get started.
    </p>


    {data?.status !== 200 ? (<div className="mt-8 space-x-4">
      <Button asChild className={"bg-blue-600 text-white rounded hover:bg-blue-700"}>
        <Link
          to="/login"
        >
          ログイン
        </Link>
      </Button>
      <Button asChild className={"bg-green-600 text-white rounded hover:bg-green-700"}>
        <Link
          to="/register"
        >
          アカウント登録
        </Link>
      </Button>
    </div>) : (<div className="mt-8">
      <p className="mb-4">Logged in as {data?.data.email}</p>
    </div>)}
  </div>)
}
