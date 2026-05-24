import { createFileRoute } from "@tanstack/react-router"
import { useGetUsersMe } from "@/api/generated/default/default"

export const Route = createFileRoute("/")({component: Home})

function Home() {
  const {data, isLoading, isError} = useGetUsersMe()

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>エラーが発生しました</div>

  return <div className="p-8">
    <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
    <p className="mt-4 text-lg">
      Edit <code>src/routes/index.tsx</code> to get started.
    </p>
    <p>
      API Response: {JSON.stringify(data?.data)}
    </p>
  </div>
}
