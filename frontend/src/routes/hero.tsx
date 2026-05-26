import {
  createFileRoute,
  Link,
} from "@tanstack/react-router"
import { useGetSelf } from "#/api/generated/default/default.ts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hero")({component: Home})

function Home() {
  const {data, isLoading, isError} = useGetSelf()

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (isError) return <div className="p-8 text-center text-red-500">An internal error occurred. Check your internet connection and try again later.</div>

  return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-24 text-center">


        <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Welcome to ktor-tanstack-router-template
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Edit <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold">src/routes/index.tsx</code> to get started.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {data?.status !== 200 ? (
              <>
                {/* ログインボタン */}
                <Button asChild size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground rounded hover:opacity-90 shadow-md transition-all">
                  <Link to="/login">
                    ログイン
                  </Link>
                </Button>

                {/* アカウント登録ボタン */}
                <Button asChild size="lg" variant="secondary" className="h-12 px-8 text-base rounded shadow-sm transition-all">
                  <Link to="/register">
                    アカウント登録
                  </Link>
                </Button>
              </>
          ) : (
              <div className="mt-8">
                <p className="mb-4 text-lg text-muted-foreground">
                  Logged in as <span className="font-semibold text-foreground">{data?.data.email}</span>
                </p>
              </div>
          )}
        </div>
      </div>
  )
}