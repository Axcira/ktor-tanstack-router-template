import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to ktor-tanstack-router-template
        </h1>
        <p className="text-muted-foreground">
          Edit{" "}
          <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm font-semibold">
            src/routes/index.tsx
          </code>{" "}
          to get started.
        </p>
      </div>
    </div>
  );
}
