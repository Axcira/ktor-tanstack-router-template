import { createFileRoute } from "@tanstack/react-router"
import WelcomeMessage from "@/features/dashboard/components/WelcomeMessage";
import AuthButtons from "@/features/auth/components/AuthButtons.tsx";

export const Route = createFileRoute("/hero")({component: Home})

function Home() {
  return (<div
    className="relative flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">

    <WelcomeMessage/>
    <AuthButtons/>

  </div>)
}
