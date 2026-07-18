import { createFileRoute } from "@tanstack/react-router";

import PlaygroundPage from "@/features/playground/components/PlaygroundPage";

export const Route = createFileRoute("/_app/playground/nav1-2")({
  component: () => <PlaygroundPage title="Playground Nav 1-2" />,
});
