import { createFileRoute } from "@tanstack/react-router"
import { useGetSelf } from "#/api/generated/default/default.ts";
import WelcomeMessage from "#/components/WelcomeMessage.tsx";
import AuthButton from "@/components/auth/AuthButton";

export const Route = createFileRoute("/hero")({component: Home})

function Home() {
  const {isLoading, isError} = useGetSelf()

  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (isError) return <div className="p-8 text-center text-red-500">An internal error occurred. Check your internet connection and try again
    later.</div>

  return (<div
    className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">

    <WelcomeMessage/>
    <AuthButton/>

  </div>)
}
