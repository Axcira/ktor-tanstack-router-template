import { createFileRoute } from "@tanstack/react-router";

import DocumentationPage from "@/features/documentation/components/DocumentationPage";

export const Route = createFileRoute("/_app/documentation")({
  component: DocumentationPage,
});
