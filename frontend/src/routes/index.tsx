import { createFileRoute, redirect } from "@tanstack/react-router";
import { ButtonLink } from "@/components/ui/button";
import { loadSession } from "@/lib/self";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (await loadSession()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Home,
});

function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">
      <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
        Welcome to ktor-tanstack-router-template
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        Edit{" "}
        <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold">
          src/routes/index.tsx
        </code>{" "}
        to get started.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <ButtonLink
          size="lg"
          className="h-12 px-8 text-base bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-md transition-all"
          to="/login"
        >
          ログイン
        </ButtonLink>
      </div>
    </div>
  );
}
