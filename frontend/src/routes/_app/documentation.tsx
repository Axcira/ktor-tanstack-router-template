import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documentation")({
  component: DocumentationPage,
});

function DocumentationPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
    </div>
  );
}
