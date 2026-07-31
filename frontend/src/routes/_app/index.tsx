import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-linear-to-b from-background to-muted/40 px-4 py-24 text-center">
      <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
        Welcome to ktor-tanstack-router-template
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        Edit{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold">
          src/routes/index.tsx
        </code>{" "}
        to get started.
      </p>
    </div>
  );
}
